from sqlalchemy.orm import Session
from . import models, schemas, auth

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email.lower()).first()

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user_in: schemas.UserCreate, role: str = "student"):
    hashed_password = auth.get_password_hash(user_in.password)
    db_user = models.User(
        fullName=user_in.fullName,
        email=user_in.email.lower(),
        password=hashed_password,
        role=role,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def calculate_profile_completion(profile: models.UserProfile) -> int:
    if not profile:
        return 0
    core_fields = [
        profile.gender,
        profile.mobileNumber,
        profile.state,
        profile.college,
        profile.university,
        profile.degree,
        profile.department,
        profile.year,
        profile.tenthPercentage or profile.twelfthPercentage or profile.cgpa,
        profile.annualIncome,
        profile.category,
        profile.dob or profile.age
    ]
    filled_core = sum(1 for f in core_fields if f is not None and str(f).strip() not in ("", "None"))
    score = int((filled_core / len(core_fields)) * 100)
    return min(100, max(0, score))

# Profile CRUD
def get_user_profile(db: Session, user_id: int):
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    if not profile:
        profile = models.UserProfile(user_id=user_id, completionScore=0)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        calc_score = calculate_profile_completion(profile)
        if profile.completionScore != calc_score:
            profile.completionScore = calc_score
            db.commit()
            db.refresh(profile)
    return profile

def update_user_profile(db: Session, user_id: int, profile_in: schemas.UserProfileCreate):
    from datetime import date as date_type
    profile = get_user_profile(db, user_id)
    update_data = profile_in.model_dump(exclude_unset=True)
    
    if "fullName" in update_data:
        full_name = update_data.pop("fullName")
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user:
            user.fullName = full_name
            db.add(user)
            
    for key, value in update_data.items():
        setattr(profile, key, value)

    # Auto-derive age from DOB (DOB is source of truth)
    if profile.dob:
        try:
            today = date_type.today()
            birth = profile.dob if isinstance(profile.dob, date_type) else date_type.fromisoformat(str(profile.dob))
            age = today.year - birth.year
            if (today.month, today.day) < (birth.month, birth.day):
                age -= 1
            profile.age = age if age >= 0 else None
        except Exception:
            pass

    profile.completionScore = calculate_profile_completion(profile)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

def get_ocr_data(db: Session, user_id: int):
    ocr = db.query(models.OCRData).filter(models.OCRData.user_id == user_id).first()
    if not ocr:
        ocr = models.OCRData(user_id=user_id)
        db.add(ocr)
        db.commit()
        db.refresh(ocr)
    return ocr


# Document CRUD
def get_user_documents(db: Session, user_id: int):
    return db.query(models.Document).filter(models.Document.user_id == user_id).all()

def get_user_document_by_type(db: Session, user_id: int, doc_type: str):
    return db.query(models.Document).filter(models.Document.user_id == user_id, models.Document.document_type == doc_type).first()

def create_or_update_document(db: Session, user_id: int, doc_type: str, filename: str, file_path: str):
    doc = get_user_document_by_type(db, user_id, doc_type)
    if doc:
        doc.filename = filename
        doc.file_path = file_path
        doc.status = "UPLOADED"
    else:
        doc = models.Document(
            user_id=user_id,
            document_type=doc_type,
            filename=filename,
            file_path=file_path,
            status="UPLOADED"
        )
        db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def update_document_status(db: Session, doc_id: int, status: str, extracted_data: str = None):
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if doc:
        doc.status = status
        if extracted_data:
            doc.extracted_data = extracted_data
        db.commit()
        db.refresh(doc)
    return doc

def delete_user_document(db: Session, user_id: int, doc_type: str):
    doc = get_user_document_by_type(db, user_id, doc_type)
    if doc:
        db.delete(doc)
        db.commit()
        return True
    return False

# Scholarship CRUD
def get_scholarships(db: Session):
    return db.query(models.Scholarship).all()

def get_scholarship_by_id(db: Session, scholarship_id: int):
    return db.query(models.Scholarship).filter(models.Scholarship.s_no == scholarship_id).first()

def create_scholarship(
    db: Session,
    scholarship_name: str,
    amount: int,
    deadline,
    description: str = None,
    provider: str = None,
    scholarship_type: str = None,
    degree: str = None,
    department: str = None,
    min_cgpa: float = 0.0,
    min_10th_percentage: float = 0.0,
    min_12th_percentage: float = 0.0,
    max_family_income: int = 9999999,
    category: str = "All",
    state: str = None,
    gender: str = "All",
    official_url: str = None,
    notes: str = None,
    first_graduate: bool = False,
    disability_required: bool = False,
    sports_quota: bool = False,
    ncc_required: bool = False,
    nss_required: bool = False,
    minority_required: bool = False,
    arrears_allowed: bool = True,
    required_documents: str = None,
    eligibility_text: str = None
):
    db_scholarship = models.Scholarship(
        scholarship_name=scholarship_name,
        provider=provider,
        scholarship_type=scholarship_type,
        degree=degree,
        department=department,
        min_cgpa=min_cgpa,
        min_10th_percentage=min_10th_percentage,
        min_12th_percentage=min_12th_percentage,
        max_family_income=max_family_income,
        category=category,
        state=state,
        gender=gender,
        amount=amount,
        deadline=deadline,
        official_url=official_url,
        description=description,
        notes=notes,
        first_graduate=first_graduate,
        disability_required=disability_required,
        sports_quota=sports_quota,
        ncc_required=ncc_required,
        nss_required=nss_required,
        minority_required=minority_required,
        arrears_allowed=arrears_allowed,
        required_documents=required_documents,
        eligibility_text=eligibility_text
    )
    db.add(db_scholarship)
    db.commit()
    db.refresh(db_scholarship)
    return db_scholarship

# Saved Scholarships CRUD
def get_saved_scholarships(db: Session, user_id: int):
    saved_items = db.query(models.SavedScholarship).filter(models.SavedScholarship.user_id == user_id).all()
    for item in saved_items:
        item.scholarship = get_scholarship_by_id(db, item.scholarship_id)
    return saved_items

def save_scholarship(db: Session, user_id: int, scholarship_id: int):
    exists = db.query(models.SavedScholarship).filter(
        models.SavedScholarship.user_id == user_id,
        models.SavedScholarship.scholarship_id == scholarship_id
    ).first()
    if exists:
        return exists
    db_saved = models.SavedScholarship(user_id=user_id, scholarship_id=scholarship_id)
    db.add(db_saved)
    db.commit()
    db.refresh(db_saved)
    return db_saved

def unsave_scholarship(db: Session, user_id: int, scholarship_id: int):
    db_saved = db.query(models.SavedScholarship).filter(
        models.SavedScholarship.user_id == user_id,
        models.SavedScholarship.scholarship_id == scholarship_id
    ).first()
    if db_saved:
        db.delete(db_saved)
        db.commit()
        return True
    return False

# Applications CRUD
def get_user_applications(db: Session, user_id: int):
    apps = db.query(models.Application).filter(models.Application.user_id == user_id).all()
    for app in apps:
        app.scholarship = get_scholarship_by_id(db, app.scholarship_id)
    return apps

def create_application(db: Session, user_id: int, scholarship_id: int, status: str = "Recommended"):
    exists = db.query(models.Application).filter(
        models.Application.user_id == user_id,
        models.Application.scholarship_id == scholarship_id
    ).first()
    if exists:
        return exists
    db_app = models.Application(user_id=user_id, scholarship_id=scholarship_id, status=status)
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

def update_application_status(db: Session, user_id: int, scholarship_id: int, status: str):
    db_app = db.query(models.Application).filter(
        models.Application.user_id == user_id,
        models.Application.scholarship_id == scholarship_id
    ).first()
    if not db_app:
        db_app = models.Application(user_id=user_id, scholarship_id=scholarship_id, status=status)
        db.add(db_app)
    else:
        db_app.status = status
    db.commit()
    db.refresh(db_app)
    return db_app

# Chat CRUD
def get_chat_history(db: Session, user_id: int):
    return db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user_id).order_by(models.ChatHistory.created_at.asc()).all()

def add_chat_message(db: Session, user_id: int, message: str, sender: str):
    db_msg = models.ChatHistory(user_id=user_id, message=message, sender=sender)
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

def clear_chat_history(db: Session, user_id: int):
    db.query(models.ChatHistory).filter(models.ChatHistory.user_id == user_id).delete()
    db.commit()
    return True

# Agent Workflow State CRUD
def get_agent_workflow_state(db: Session, user_id: int):
    state = db.query(models.AgentWorkflowState).filter(models.AgentWorkflowState.user_id == user_id).first()
    if not state:
        state = models.AgentWorkflowState(
            user_id=user_id,
            current_stage="NOT_STARTED",
            profile_status="Pending",
            matching_status="Pending",
            verification_status="Pending",
            application_status="Pending"
        )
        db.add(state)
        db.commit()
        db.refresh(state)
    
    # Auto-align stage if the selected scholarship is already submitted
    if state.scholarship_id is not None:
        submitted_app = db.query(models.Application).filter(
            models.Application.user_id == user_id,
            models.Application.scholarship_id == state.scholarship_id,
            models.Application.status == "SUBMITTED"
        ).first()
        if submitted_app and state.current_stage != "SUBMITTED":
            state.current_stage = "SUBMITTED"
            state.current_task = "Application submitted successfully."
            db.commit()
            db.refresh(state)
    
    # Check for stale/invalid scholarship_id
    if state.scholarship_id is not None:
        sch_exists = db.query(models.Scholarship).filter(models.Scholarship.id == state.scholarship_id).first()
        if not sch_exists:
            # Find the user's valid applications
            user_apps = db.query(models.Application).filter(models.Application.user_id == user_id).all()
            resolved_sch_id = None
            for app in user_apps:
                app_sch_exists = db.query(models.Scholarship).filter(models.Scholarship.id == app.scholarship_id).first()
                if app_sch_exists:
                    resolved_sch_id = app.scholarship_id
                    break
            
            if resolved_sch_id is not None:
                state.scholarship_id = resolved_sch_id
                db.commit()
                db.refresh(state)
            else:
                state.scholarship_id = None
                db.commit()
                db.refresh(state)
    return state

def update_agent_workflow_state(db: Session, user_id: int, **kwargs):
    state = get_agent_workflow_state(db, user_id)
    for key, val in kwargs.items():
        if hasattr(state, key):
            setattr(state, key, val)
    db.commit()
    db.refresh(state)
    return state

def reset_agent_workflow_state(db: Session, user_id: int):
    state = get_agent_workflow_state(db, user_id)
    state.scholarship_id = None
    state.current_stage = "NOT_STARTED"
    state.current_task = None
    state.profile_status = "Pending"
    state.matching_status = "Pending"
    state.required_documents = None
    state.uploaded_documents = None
    state.verification_status = "Pending"
    state.application_status = "Pending"
    state.pending_actions = None
    state.last_agent = None
    state.next_agent = None
    state.decision_reason = None
    db.commit()
    db.refresh(state)
    
    # Also delete logs for this user to make it clean
    db.query(models.AgentDecisionLog).filter(models.AgentDecisionLog.user_id == user_id).delete()
    db.commit()
    return state

# Agent Decision Log CRUD
def create_agent_decision_log(
    db: Session,
    user_id: int,
    agent_name: str,
    action: str,
    input_context_summary: str = None,
    decision: str = None,
    result: str = None,
    next_action: str = None,
    status: str = "Success"
):
    return None

def get_agent_decision_logs(db: Session, user_id: int):
    return []


