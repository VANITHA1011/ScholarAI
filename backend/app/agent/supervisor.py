from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
import json
import logging
from datetime import datetime

from .. import models, crud
from .profile_agent import ProfileAgent
from .matching_agent import ScholarshipMatchingAgent
from .document_agent import RequiredDocumentAgent
from .ocr_agent import OCRAgent, correct_ocr_name
from .verification_agent import VerificationAgent
from .recommendation_agent import AIRecommendationAgent
from .document_collector_agent import DocumentCollectorAgent, WORKFLOW_STATES

import sys

# Configure dedicated agent logger
logger = logging.getLogger("ScholarVerse.Supervisor")
logger.setLevel(logging.INFO)


class WorkflowContext:
    """
    In-memory context maintained by the Supervisor during a single workflow execution.
    Contains user state, active event, executed agent results, and decision paths.
    """
    def __init__(self, user_id: int, event: str = "EVALUATE", scholarship_id: Optional[int] = None):
        self.user_id: int = user_id
        self.event: str = event
        
        # Safely parse scholarship_id
        parsed_id = None
        if scholarship_id is not None:
            try:
                parsed_id = int(scholarship_id)
            except (ValueError, TypeError):
                parsed_id = None
        self.scholarship_id: Optional[int] = parsed_id
        
        # State indicators
        self.current_stage: str = "NOT_STARTED"
        self.profile_complete: Optional[bool] = None
        self.missing_fields: List[str] = []
        
        # Results from agents
        self.completed_steps: List[str] = []
        self.matching_results: List[Dict[str, Any]] = []
        self.recommendation_result: Optional[Dict[str, Any]] = None
        self.ai_explanation: Optional[str] = None
        
        # Document & OCR & Verification tracking
        self.required_documents: List[str] = []
        self.uploaded_documents: List[str] = []
        self.missing_documents: List[str] = []
        self.mismatch_documents: List[str] = []
        self.ocr_failed_documents: List[str] = []
        self.mismatches: List[Dict[str, Any]] = []
        self.ocr_data: Dict[str, Any] = {}
        
        # Next action decision
        self.next_action: str = "IN_PROGRESS"
        self.decision_reason: str = ""
        self.errors: List[str] = []
        self.execution_logs: List[str] = []

    def log(self, tag: str, message: str):
        log_entry = f"[{tag}] {message}"
        self.execution_logs.append(log_entry)
        try:
            sys.stdout.buffer.write((log_entry + "\n").encode("utf-8", errors="replace"))
            sys.stdout.buffer.flush()
        except Exception:
            try:
                print(log_entry.encode("ascii", errors="replace").decode("ascii"))
            except Exception:
                pass


class SupervisorAgent:
    """
    ScholarVerse Supervisor Agent (Phase 1: Autonomous Planning & Orchestration)
    
    Responsibilities:
    1. Inspects student profile, documents, and workflow state.
    2. Constructs a dynamic task plan based on the triggering event.
    3. Deterministically decides which specialized agent executes next.
    4. Evaluates agent outputs and dynamically directs next actions.
    5. Safely halts when human input is required (Profile missing, Doc needed, Mismatch).
    6. Persists audit logs and workflow states without breaking existing contracts.
    """
    def __init__(self, db: Session):
        self.db = db
        self.profile_agent = ProfileAgent(db)
        self.matching_agent = ScholarshipMatchingAgent(db)
        self.doc_agent = RequiredDocumentAgent(db)
        self.ocr_agent = OCRAgent(db)
        self.verification_agent = VerificationAgent(db)
        self.recommendation_agent = AIRecommendationAgent(db)
        self.collector_agent = DocumentCollectorAgent(db)

    def create_plan(self, context: WorkflowContext) -> List[str]:
        """
        Autonomous Planning:
        Constructs an ordered list of tasks based on the trigger event and current state.
        Strict prerequisite order: Profile -> Documents -> OCR -> Verification -> Matching -> Recommendations.
        """
        event = context.event
        context.log("SUPERVISOR", f"Event received: {event} (User ID: {context.user_id})")

        if event == "DOCUMENT_UPLOADED":
            plan = ["PROCESS_OCR", "VERIFY_DOCUMENTS", "CHECK_PROFILE", "CHECK_DOCUMENTS", "RUN_MATCHING", "RUN_RECOMMENDATIONS"]
        elif event == "PROFILE_SUBMITTED":
            plan = ["PROCESS_OCR", "VERIFY_DOCUMENTS", "CHECK_PROFILE", "CHECK_DOCUMENTS", "RUN_MATCHING", "RUN_RECOMMENDATIONS"]
        elif event == "SCHOLARSHIP_SELECTED":
            plan = ["PROCESS_OCR", "VERIFY_DOCUMENTS", "CHECK_PROFILE", "CHECK_DOCUMENTS", "RUN_MATCHING", "RUN_RECOMMENDATIONS"]
        else: # Default evaluation / sync
            plan = ["PROCESS_OCR", "VERIFY_DOCUMENTS", "CHECK_PROFILE", "CHECK_DOCUMENTS", "RUN_MATCHING", "RUN_RECOMMENDATIONS"]

        context.log("SUPERVISOR", f"Generated Execution Plan: {' -> '.join(plan)}")
        return plan

    def run_pipeline(self, user_id: int, scholarship_id: Optional[int] = None, event: str = "EVALUATE") -> dict:
        """
        Master orchestration loop:
        Executes the planned workflow, evaluates intermediate agent results, and handles exceptions safely.
        """
        context = WorkflowContext(user_id=user_id, event=event, scholarship_id=scholarship_id)
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            context.log("SUPERVISOR", f"User with ID {user_id} does not exist.")
            return {
                "action": "ERROR",
                "message": f"User ID {user_id} not found.",
                "missing_fields": ["user_record"],
                "missing_documents": [],
                "required_documents": [],
                "mismatches": [],
                "scholarships": [],
                "ai_explanation": None,
                "ocr_data": {}
            }

        state = crud.get_agent_workflow_state(self.db, user_id)

        # Check if already submitted (only halt if passive evaluation and no active event or new scholarship)
        if state and state.current_stage == "SUBMITTED" and event == "EVALUATE" and not scholarship_id:
            context.log("SUPERVISOR", "Application is already submitted. Halting passive evaluation.")
            return {
                "action": "COMPLETED",
                "message": "Application already submitted.",
                "missing_fields": [],
                "missing_documents": [],
                "required_documents": [],
                "mismatches": [],
                "scholarships": [],
                "ai_explanation": None,
                "ocr_data": {}
            }

        # If a new event occurs on a submitted state, transition back to active workflow
        if state and state.current_stage == "SUBMITTED" and event in ("PROFILE_SUBMITTED", "DOCUMENT_UPLOADED", "SCHOLARSHIP_SELECTED"):
            state.current_stage = "NOT_STARTED"
            self.db.add(state)
            self.db.commit()

        # Sync scholarship selection into state
        if scholarship_id:
            state.scholarship_id = scholarship_id
            state.current_stage = "MATCHING"
            self.db.add(state)
            self.db.commit()
        else:
            context.scholarship_id = state.scholarship_id

        # Generate autonomous task plan
        plan = self.create_plan(context)

        # Execute plan steps deterministically
        for step in plan:
            if context.next_action in ("COMPLETE_PROFILE", "SELECT_SCHOLARSHIP", "WAIT_FOR_DOCUMENT", "RESOLVE_MISMATCH", "MATCHING_FAILED", "COMPLETED"):
                context.log("SUPERVISOR", f"Halting plan execution early as action requires user intervention: {context.next_action}")
                break

            try:
                if step == "PROCESS_OCR":
                    self._execute_ocr_processing(context)
                elif step == "VERIFY_DOCUMENTS":
                    self._execute_document_verification(context)
                elif step == "CHECK_PROFILE":
                    self._execute_profile_check(context)
                elif step in ("RUN_MATCHING", "RE_RUN_MATCHING"):
                    self._execute_matching(context)
                elif step == "CHECK_DOCUMENTS":
                    self._execute_document_requirements_check(context)
                elif step == "RUN_RECOMMENDATIONS":
                    self._execute_recommendation_generation(context)
            except Exception as e:
                context.log("SUPERVISOR", f"Exception during step {step}: {str(e)}")
                context.errors.append(f"Error in {step}: {str(e)}")
                context.current_stage = "ERROR"
                context.next_action = "ERROR"
                context.decision_reason = f"Workflow encountered an error during {step}."
                break

        # Persist final state and logs to database
        self._persist_workflow_results(context, state)

        # Format and return consistent response contract
        return self._build_supervisor_response(context, state)

    # ─────────────────────────────────────────────────────────────────────────
    # Individual Agent Execution & Decision Handlers
    # ─────────────────────────────────────────────────────────────────────────

    def _execute_ocr_processing(self, context: WorkflowContext):
        """Processes any uploaded documents through Tesseract OCR with smart caching."""
        if "PROCESS_OCR" in context.completed_steps:
            return

        documents = crud.get_user_documents(self.db, context.user_id)
        unprocessed = [
            d for d in documents 
            if (d.status in ("Uploaded", "UPLOADED", "OCR_PROCESSING", "Pending") or not d.extracted_data)
            and d.status not in ("VERIFIED", "Verified")
        ]
        
        if unprocessed:
            context.log("SUPERVISOR", f"Found {len(unprocessed)} document(s) to process. Triggering OCR Agent.")
            for doc in unprocessed:
                doc.status = "OCR_PROCESSING"
                self.db.add(doc)
                self.db.commit()

                context.log("OCR_AGENT", f"Extracting text from {doc.document_type} ({doc.file_path})")
                extracted = self.ocr_agent.extract_data(context.user_id, doc.document_type, doc.file_path)

                if extracted.get("status") in ("ocr_failed", "error"):
                    doc.status = "OCR_FAILED"
                    doc.extracted_data = json.dumps({
                        "ocr_status": "OCR_FAILED",
                        "error_message": extracted.get("error_message") or extracted.get("message", "OCR processing failed."),
                        "extracted_fields": extracted.get("parsed", {}),
                        "processed_timestamp": datetime.now().isoformat()
                    })
                    context.log("OCR_AGENT", f"OCR failed for {doc.document_type}: {extracted.get('error_message') or extracted.get('message')}")
                else:
                    doc.status = "OCR_COMPLETED"
                    doc.extracted_data = json.dumps({
                        "ocr_status": "OCR_COMPLETED",
                        "raw_text": extracted.get("raw_text", ""),
                        "extracted_fields": extracted,
                        "processed_timestamp": datetime.now().isoformat()
                    })
                    context.log("OCR_AGENT", f"OCR successfully extracted text for {doc.document_type}.")

                self.db.add(doc)
                self.db.commit()
        else:
            context.log("SUPERVISOR", "All documents already have valid OCR extractions. Skipping duplicate processing.")

        # Ensure all extracted document data is synchronized into OCRData model
        ocr_model = crud.get_ocr_data(self.db, context.user_id)
        user = crud.get_user(self.db, context.user_id)
        profile_name = user.fullName if user else None
        for doc in documents:
            if doc.extracted_data:
                try:
                    data = json.loads(doc.extracted_data)
                    fields = data.get("extracted_fields") or data
                    if fields.get("name"):
                        clean_name = correct_ocr_name(fields.get("name"), profile_name)
                        if doc.document_type == "aadhaar" or not ocr_model.name or ocr_model.name != clean_name:
                            ocr_model.name = clean_name
                    if fields.get("gender") and not ocr_model.gender:
                        ocr_model.gender = fields.get("gender")
                    if fields.get("state") and not ocr_model.state:
                        ocr_model.state = fields.get("state")
                    if (fields.get("annual_income") or fields.get("income")) and ocr_model.income is None:
                        ocr_model.income = float(fields.get("annual_income") or fields.get("income"))
                    if (fields.get("category") or fields.get("community")) and not ocr_model.community:
                        ocr_model.community = fields.get("category") or fields.get("community")
                    if fields.get("cgpa") is not None and ocr_model.cgpa is None:
                        ocr_model.cgpa = float(fields.get("cgpa"))
                    if (fields.get("calculated_percentage") or fields.get("percentage") or fields.get("marks")) and ocr_model.marks is None:
                        ocr_model.marks = float(fields.get("calculated_percentage") or fields.get("percentage") or fields.get("marks"))
                except Exception:
                    pass
        self.db.add(ocr_model)
        self.db.commit()

        context.completed_steps.append("PROCESS_OCR")

    def _execute_document_verification(self, context: WorkflowContext):
        """Cross-checks OCR extracted fields against student profile values."""
        if "VERIFY_DOCUMENTS" in context.completed_steps:
            return

        documents = crud.get_user_documents(self.db, context.user_id)
        # Any document that has completed OCR extraction and has extracted_data (or is OCR_COMPLETED) should be verified / re-verified
        ready_for_verify = [
            d for d in documents 
            if d.status in ("OCR_COMPLETED", "OCR Completed") or (d.extracted_data and d.status in ("MISMATCH", "Mismatch", "VERIFIED", "Verified", "VERIFICATION_PROCESSING", "Uploaded", "UPLOADED"))
        ]

        if not ready_for_verify:
            context.completed_steps.append("VERIFY_DOCUMENTS")
            return

        context.log("SUPERVISOR", f"Verifying {len(ready_for_verify)} document(s) with Verification Agent.")

        for doc in ready_for_verify:
            doc.status = "VERIFICATION_PROCESSING"
            self.db.add(doc)
            self.db.commit()

            verify_res = self.verification_agent.verify_single_document(context.user_id, doc)
            if verify_res["status"] == "VERIFIED":
                doc.status = "VERIFIED"
                context.log("VERIFICATION_AGENT", f"Document {doc.document_type} verified successfully.")
            else:
                doc.status = "MISMATCH"
                context.log("VERIFICATION_AGENT", f"Document {doc.document_type} has discrepancies: {verify_res.get('reasons')}")

            existing_data = {}
            if doc.extracted_data:
                try:
                    existing_data = json.loads(doc.extracted_data)
                except Exception:
                    pass
            existing_data["verification_status"] = doc.status
            existing_data["mismatch_fields"] = verify_res.get("mismatch_fields", {})
            existing_data["reasons"] = verify_res.get("reasons", [])
            doc.extracted_data = json.dumps(existing_data)

            self.db.add(doc)
            self.db.commit()

        context.completed_steps.append("VERIFY_DOCUMENTS")

    def _execute_profile_check(self, context: WorkflowContext):
        """Validates student profile completeness and numerical ranges."""
        context.log("SUPERVISOR", "Checking profile completeness with Profile Agent.")
        profile_res = self.profile_agent.validate_profile(context.user_id)

        if profile_res["status"] == "Incomplete":
            context.profile_complete = False
            context.missing_fields = profile_res.get("missing_fields", [])
            context.current_stage = "PROFILE_INCOMPLETE"
            context.next_action = "COMPLETE_PROFILE"
            context.decision_reason = f"Profile incomplete. Missing fields: {', '.join(context.missing_fields)}"
            context.log("PROFILE_AGENT", f"Profile incomplete. Missing: {context.missing_fields}")
            context.log("SUPERVISOR", "Decision: Halting workflow until profile is completed.")
        else:
            context.profile_complete = True
            context.current_stage = "PROFILE_READY"
            context.log("PROFILE_AGENT", "Profile is complete and valid.")
            context.log("SUPERVISOR", "Decision: Profile ready. Proceeding to matching.")

        context.completed_steps.append("CHECK_PROFILE")

    def _execute_matching(self, context: WorkflowContext):
        """Evaluates 16-parameter scholarship eligibility and ranking."""
        context.log("SUPERVISOR", "Executing Scholarship Matching Agent (16-criteria evaluation).")
        matches = self.matching_agent.match_scholarships(context.user_id)
        context.matching_results = matches
        context.current_stage = "MATCHING_COMPLETED"
        context.log("MATCHING_AGENT", f"Matching completed. Evaluated {len(matches)} scholarship(s).")

        if not context.scholarship_id:
            context.current_stage = "MATCHING"
            context.next_action = "SELECT_SCHOLARSHIP"
            context.decision_reason = "Global scholarship matching completed. Please select a scholarship from recommendations to continue the journey."
            context.log("SUPERVISOR", "Decision: Matching list compiled. Waiting for student scholarship selection.")
        else:
            selected_match = next((m for m in matches if m["id"] == context.scholarship_id), None)
            if not selected_match or selected_match["status"] not in ("Eligible", "Partially Eligible"):
                context.current_stage = "MATCHING_FAILED"
                context.next_action = "MATCHING_FAILED"
                context.decision_reason = "Student does not satisfy the criteria for the selected scholarship."
                context.log("SUPERVISOR", f"Decision: Not eligible for scholarship ID {context.scholarship_id}.")
            else:
                context.current_stage = "MATCHING"
                context.log("SUPERVISOR", f"Decision: Eligible for scholarship ID {context.scholarship_id}. Proceeding to document audit.")

        context.completed_steps.append("RUN_MATCHING")

    def _execute_document_requirements_check(self, context: WorkflowContext):
        """Audits required documents (baseline identity/income or specific scholarship docs) vs uploaded records."""
        if context.scholarship_id:
            context.log("SUPERVISOR", f"Auditing document requirements for scholarship ID {context.scholarship_id}.")
            required_docs = self.doc_agent.get_required_documents(context.scholarship_id)
        else:
            context.log("SUPERVISOR", "Auditing baseline required documents (Aadhaar, Income Certificate, etc.).")
            required_docs = ["aadhaar", "income"]

        context.required_documents = required_docs

        documents = crud.get_user_documents(self.db, context.user_id)
        doc_map = {d.document_type: d for d in documents}

        missing_docs = []
        mismatch_docs = []
        ocr_failed_docs = []
        uploaded_list = []

        for rdoc in required_docs:
            if rdoc not in doc_map or doc_map[rdoc].status in ("Pending", "Not Uploaded", "NOT_UPLOADED"):
                missing_docs.append(rdoc)
            else:
                uploaded_list.append(rdoc)
                if doc_map[rdoc].status in ("MISMATCH", "Mismatch"):
                    mismatch_docs.append(rdoc)
                elif doc_map[rdoc].status in ("OCR_FAILED", "OCR Failed"):
                    ocr_failed_docs.append(rdoc)

        context.uploaded_documents = uploaded_list
        context.missing_documents = missing_docs
        context.mismatch_documents = mismatch_docs
        context.ocr_failed_documents = ocr_failed_docs

        if missing_docs:
            context.current_stage = "DOCUMENTS_MISSING"
            context.next_action = "WAIT_FOR_DOCUMENT"
            context.decision_reason = f"Missing required documents: {', '.join(missing_docs)}"
            context.log("SUPERVISOR", f"Decision: Documents missing ({missing_docs}). Halting workflow for student upload.")
        elif mismatch_docs or ocr_failed_docs:
            reasons = []
            for doc_type in mismatch_docs + ocr_failed_docs:
                d = doc_map[doc_type]
                if d.extracted_data:
                    try:
                        data = json.loads(d.extracted_data)
                        if d.status in ("OCR_FAILED", "OCR Failed"):
                            reasons.append(f"{doc_type.capitalize()}: {data.get('error_message')}")
                        else:
                            reasons.extend(data.get('reasons', []))
                    except Exception:
                        pass
            context.current_stage = "CORRECTION_REQUIRED"
            context.next_action = "RESOLVE_MISMATCH"
            context.decision_reason = f"Verification Mismatch: {', '.join(reasons)}"
            context.log("SUPERVISOR", f"Decision: Document discrepancies found. Halting for correction.")
        else:
            if context.scholarship_id:
                context.current_stage = "APPLICATION_READY"
                context.log("SUPERVISOR", "Decision: All required documents verified. Application is ready for generation.")
            else:
                context.log("SUPERVISOR", "Decision: All baseline documents uploaded & verified.")

        context.completed_steps.append("CHECK_DOCUMENTS")

    def _execute_recommendation_generation(self, context: WorkflowContext):
        """Generates AI guidance package when application is fully verified."""
        if context.current_stage != "APPLICATION_READY" or not context.scholarship_id:
            context.completed_steps.append("RUN_RECOMMENDATIONS")
            return

        context.log("SUPERVISOR", "Generating final recommendation guidelines with Recommendation Agent.")
        rec_res = self.recommendation_agent.generate_recommendation(context.user_id, context.scholarship_id)
        context.recommendation_result = rec_res
        context.ai_explanation = rec_res.get("ai_explanation")
        context.next_action = "APPLICATION_READY"
        context.decision_reason = "Scholarship application checklist complete. Ready to apply!"
        context.log("RECOMMENDATION_AGENT", "Application guidelines generated successfully.")
        context.completed_steps.append("RUN_RECOMMENDATIONS")

    # ─────────────────────────────────────────────────────────────────────────
    # State Persistence & Response Building
    # ─────────────────────────────────────────────────────────────────────────

    def _persist_workflow_results(self, context: WorkflowContext, state: Any):
        """Saves current workflow state and audit logs into the database."""
        profile_status = "Complete" if context.profile_complete else ("Pending" if context.profile_complete is False else state.profile_status)
        matching_status = "Completed" if context.matching_results else state.matching_status
        verification_status = "Verified" if context.current_stage == "APPLICATION_READY" else ("Mismatch" if context.current_stage == "CORRECTION_REQUIRED" else state.verification_status)
        application_status = "Ready" if context.current_stage == "APPLICATION_READY" else state.application_status

        crud.update_agent_workflow_state(
            self.db, context.user_id,
            current_stage=context.current_stage,
            profile_status=profile_status,
            matching_status=matching_status,
            verification_status=verification_status,
            application_status=application_status,
            required_documents=",".join(context.required_documents) if context.required_documents else state.required_documents,
            uploaded_documents=",".join(context.uploaded_documents) if context.uploaded_documents else state.uploaded_documents,
            current_task=context.decision_reason,
            last_agent="SupervisorAgent",
            decision_reason=context.decision_reason
        )

        crud.create_agent_decision_log(
            self.db, context.user_id,
            agent_name="SupervisorAgent",
            action=f"Execute Workflow: {context.event}",
            input_context_summary=f"Steps executed: {', '.join(context.completed_steps)}",
            decision=context.decision_reason,
            result=f"Current stage: {context.current_stage}",
            next_action=context.next_action,
            status="Completed" if not context.errors else "Error"
        )

    def _build_supervisor_response(self, context: WorkflowContext, state: Any) -> dict:
        """Constructs response matching schemas.SupervisorResponse without breaking frontend contracts."""
        ocr_model = crud.get_ocr_data(self.db, context.user_id)
        ocr_dict = {}
        if ocr_model:
            ocr_dict = {
                "name": ocr_model.name,
                "gender": ocr_model.gender,
                "income": ocr_model.income,
                "category": ocr_model.community,
                "state": ocr_model.state,
                "cgpa": ocr_model.cgpa,
                "marks": ocr_model.marks
            }

        # Enrich ocr_dict with any fields present in uploaded documents' extracted_data
        # Prioritize primary identity documents (aadhaar first) for name, gender, and state
        documents = crud.get_user_documents(self.db, context.user_id)
        doc_priority = {"aadhaar": 1, "tenth": 2, "twelfth": 3, "college": 4, "income": 5, "community": 6, "disability": 7}
        sorted_docs = sorted(documents, key=lambda d: doc_priority.get(d.document_type.lower(), 99))
        for doc in sorted_docs:
            if doc.extracted_data:
                try:
                    data = json.loads(doc.extracted_data)
                    fields = data.get("extracted_fields") or data
                    if (not ocr_dict.get("name") or doc.document_type.lower() == "aadhaar") and fields.get("name"):
                        ocr_dict["name"] = fields.get("name")
                        ocr_model.name = fields.get("name")
                    if not ocr_dict.get("gender") and fields.get("gender"):
                        ocr_dict["gender"] = fields.get("gender")
                        ocr_model.gender = fields.get("gender")
                    if not ocr_dict.get("state") and fields.get("state"):
                        ocr_dict["state"] = fields.get("state")
                        ocr_model.state = fields.get("state")
                    if ocr_dict.get("income") is None and (fields.get("annual_income") or fields.get("income")):
                        inc = fields.get("annual_income") or fields.get("income")
                        ocr_dict["income"] = float(inc)
                        ocr_model.income = float(inc)
                    if not ocr_dict.get("category") and (fields.get("category") or fields.get("community")):
                        cat = fields.get("category") or fields.get("community")
                        ocr_dict["category"] = cat
                        ocr_model.community = cat
                    if ocr_dict.get("cgpa") is None and fields.get("cgpa") is not None:
                        ocr_dict["cgpa"] = float(fields.get("cgpa"))
                        ocr_model.cgpa = float(fields.get("cgpa"))
                    if ocr_dict.get("marks") is None and (fields.get("calculated_percentage") or fields.get("percentage") or fields.get("marks")):
                        m = fields.get("calculated_percentage") or fields.get("percentage") or fields.get("marks")
                        ocr_dict["marks"] = float(m)
                        ocr_model.marks = float(m)
                except Exception:
                    pass
        self.db.add(ocr_model)
        self.db.commit()

        # Build detailed mismatches list
        mismatches = []
        documents = crud.get_user_documents(self.db, context.user_id)
        for doc in documents:
            if doc.status == "MISMATCH" and doc.extracted_data:
                try:
                    data = json.loads(doc.extracted_data)
                    for field, info in data.get("mismatch_fields", {}).items():
                        mismatches.append({
                            "field": field.capitalize(),
                            "profile": str(info.get("profile")),
                            "ocr": str(info.get("ocr")),
                            "message": info.get("reason")
                        })
                except Exception:
                    pass
            elif doc.status == "OCR_FAILED" and doc.extracted_data:
                try:
                    data = json.loads(doc.extracted_data)
                    mismatches.append({
                        "field": doc.document_type.capitalize(),
                        "profile": "Expected document type",
                        "ocr": "OCR Failed",
                        "message": data.get("error_message") or "Extraction error"
                    })
                except Exception:
                    pass

        # Action keyword mapping expected by UI
        if context.current_stage == "PROFILE_INCOMPLETE" or context.profile_complete is False:
            action = "NEED_PROFILE"
        elif context.current_stage == "DOCUMENTS_MISSING" or context.missing_documents:
            action = "NEED_DOCUMENTS"
        elif context.current_stage == "CORRECTION_REQUIRED" or mismatches or context.mismatch_documents:
            action = "NEED_CORRECTION"
        elif context.current_stage == "APPLICATION_READY":
            action = "APPLICATION_READY"
        elif context.current_stage == "SUBMITTED" or context.current_stage == "COMPLETED":
            action = "COMPLETED"
        elif context.matching_results and not context.scholarship_id:
            action = "NEED_SCHOLARSHIP_SELECT"
        else:
            action_map = {
                "PROFILE_INCOMPLETE": "NEED_PROFILE",
                "DOCUMENTS_MISSING": "NEED_DOCUMENTS",
                "CORRECTION_REQUIRED": "NEED_CORRECTION",
                "APPLICATION_READY": "APPLICATION_READY",
                "MATCHING_COMPLETED": "NEED_SCHOLARSHIP_SELECT" if not context.scholarship_id else "IN_PROGRESS",
                "MATCHING": "NEED_SCHOLARSHIP_SELECT",
                "COMPLETED": "COMPLETED"
            }
            action = action_map.get(context.current_stage, "IN_PROGRESS")

        req_list = context.required_documents or (state.required_documents.split(",") if state.required_documents else [])

        return {
            "action": action,
            "message": context.decision_reason or "AI Workflow updated.",
            "missing_fields": context.missing_fields,
            "missing_documents": context.missing_documents,
            "required_documents": [r for r in req_list if r],
            "mismatches": mismatches,
            "scholarships": context.matching_results,
            "ai_explanation": context.ai_explanation,
            "ocr_data": ocr_dict
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Human-in-the-Loop Document Collection Browser Automation
    # ─────────────────────────────────────────────────────────────────────────
    def start_document_collection(self, user_id: int, document_type: str, open_browser: bool = True) -> dict:
        """Starts HITL browser automation to collect a required certificate from its official portal."""
        return self.collector_agent.start_collection(user_id, document_type, open_browser_window=open_browser)

    def confirm_human_verification(self, user_id: int, document_type: str) -> dict:
        """Resumes workflow after user verifies in browser."""
        return self.collector_agent.confirm_human_verification(user_id, document_type)

    def record_manual_document_access(self, user_id: int, document_type: str) -> dict:
        """Records student choice to access portal manually."""
        return self.collector_agent.record_manual_access(user_id, document_type)

    def get_document_collection_status(self, user_id: int, document_type: str) -> dict:
        """Retrieves real-time automation state for a document."""
        return self.collector_agent.get_status(user_id, document_type)


def run_supervisor_agent(db: Session, user_id: int, scholarship_id: Optional[int] = None, event: str = "EVALUATE") -> dict:
    """Entrypoint function for supervisor workflow execution."""
    supervisor = SupervisorAgent(db)
    return supervisor.run_pipeline(user_id=user_id, scholarship_id=scholarship_id, event=event)
