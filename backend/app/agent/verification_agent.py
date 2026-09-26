import json
import re
from sqlalchemy.orm import Session
from .. import models, crud

class VerificationAgent:
    """
    Agent 6: Verification Agent
    Purpose: Compare Profile vs OCRData and handle document classification mismatches.
    """
    def __init__(self, db: Session):
        self.db = db

    def _normalize_name(self, name: str) -> str:
        if not name:
            return ""
        # Remove extra whitespace, convert to lowercase, remove non-alphanumeric noise
        cleaned = re.sub(r'\s+', ' ', name).strip().lower()
        return cleaned

    def _names_match(self, name1: str, name2: str) -> bool:
        if not name1 or not name2:
            return False
        
        # 1. Strip all spaces and punctuation (e.g. "Anbu g" -> "anbug" == "ANBUG" -> "anbug")
        compact1 = re.sub(r'[^a-zA-Z0-9]', '', str(name1)).lower()
        compact2 = re.sub(r'[^a-zA-Z0-9]', '', str(name2)).lower()
        
        if not compact1 or not compact2:
            return False
            
        if compact1 == compact2 or compact1 in compact2 or compact2 in compact1:
            return True

        # Character normalization for common OCR confusions: v <-> y, 1/l/|/! <-> i, 0 <-> o
        def ocr_norm(s):
            return s.replace('v', 'y').replace('1', 'i').replace('l', 'i').replace('|', 'i').replace('!', 'i').replace('0', 'o')
        if ocr_norm(compact1) == ocr_norm(compact2) or ocr_norm(compact1) in ocr_norm(compact2) or ocr_norm(compact2) in ocr_norm(compact1):
            return True
            
        # 2. Token / word set match (e.g. "Anbu G" -> {"anbu", "g"} == "G. Anbu" -> {"g", "anbu"})
        words1 = set(re.findall(r'[a-zA-Z0-9]+', str(name1).lower()))
        words2 = set(re.findall(r'[a-zA-Z0-9]+', str(name2).lower()))
        
        if words1 and words2:
            if words1 == words2 or words1.issubset(words2) or words2.issubset(words1):
                return True
            common = words1.intersection(words2)
            if len(common) >= min(len(words1), len(words2)):
                return True

        # 3. Fuzzy ratio match for minor OCR typos
        import difflib
        ratio = difflib.SequenceMatcher(None, compact1, compact2).ratio()
        return ratio >= 0.75

    def _normalize_category(self, cat: str) -> str:
        if not cat:
            return ""
        c = cat.strip().lower()
        mapping = {
            "sc": "sc", "scheduled caste": "sc",
            "st": "st", "scheduled tribe": "st",
            "bc": "bc", "backward class": "bc",
            "bcm": "bc", "backward class muslim": "bc",
            "mbc": "mbc", "most backward class": "mbc",
            "obc": "obc", "other backward class": "obc",
            "general": "general", "oc": "general", "fc": "general"
        }
        return mapping.get(c, c)

    def _normalize_state(self, state: str) -> str:
        if not state:
            return ""
        return re.sub(r'\s+', ' ', state).strip().lower()

    def _normalize_gender(self, gen: str) -> str:
        if not gen:
            return ""
        g = gen.strip().lower()
        if g in ("m", "male"):
            return "male"
        if g in ("f", "female"):
            return "female"
        return g

    def verify(self, user_id: int) -> dict:
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        profile = crud.get_user_profile(self.db, user_id)
        ocr_data = crud.get_ocr_data(self.db, user_id)
        documents = crud.get_user_documents(self.db, user_id)
        doc_map = {d.document_type: d for d in documents}

        mismatches = []

        # Check for classification failures first
        for doc in documents:
            if doc.extracted_data:
                try:
                    data = json.loads(doc.extracted_data)
                    if data.get("status") == "classification_failed":
                        mismatches.append({
                            "field": doc.document_type.capitalize(),
                            "profile": f"Expected: {data.get('expected')}",
                            "ocr": f"Received: {data.get('received')}",
                            "message": f"❌ Wrong Document Uploaded. Expected: {data.get('expected')}, Received: {data.get('received')}. Please upload the correct document."
                        })
                except Exception:
                    pass

        # 1. Aadhaar Check (Name, Gender, State)
        if "aadhaar" in doc_map and doc_map["aadhaar"].status != "Mismatch" and doc_map["aadhaar"].status != "OCR Failed":
            name_p = self._normalize_name(user.fullName)
            name_o = self._normalize_name(ocr_data.name)
            if not ocr_data.name:
                mismatches.append({
                    "field": "Name", "profile": user.fullName, "ocr": "Empty",
                    "message": "Aadhaar Verification: Could not parse name from Aadhaar card."
                })
            elif not self._names_match(user.fullName, ocr_data.name):
                mismatches.append({
                    "field": "Name", "profile": user.fullName, "ocr": ocr_data.name,
                    "message": f"Name mismatch: Entered '{user.fullName}', Aadhaar says '{ocr_data.name}'"
                })

            if ocr_data.gender:
                if self._normalize_gender(ocr_data.gender) != self._normalize_gender(profile.gender):
                    mismatches.append({
                        "field": "Gender", "profile": profile.gender, "ocr": ocr_data.gender,
                        "message": f"Gender mismatch: Entered '{profile.gender}', Aadhaar says '{ocr_data.gender}'"
                    })
            if ocr_data.state:
                if self._normalize_state(ocr_data.state) != self._normalize_state(profile.state):
                    mismatches.append({
                        "field": "State", "profile": profile.state, "ocr": ocr_data.state,
                        "message": f"State mismatch: Entered '{profile.state}', Aadhaar says '{ocr_data.state}'"
                    })

        # 2. Income Check
        if "income" in doc_map and doc_map["income"].status != "Mismatch" and doc_map["income"].status != "OCR Failed":
            if ocr_data.income is None:
                mismatches.append({
                    "field": "Income", "profile": f"₹{profile.annualIncome}", "ocr": "Empty",
                    "message": "Income Verification: Could not extract Annual Income from certificate."
                })
            elif profile.annualIncome is not None:
                if abs(float(ocr_data.income) - float(profile.annualIncome)) > 10.0:
                    mismatches.append({
                        "field": "Income", "profile": profile.annualIncome, "ocr": ocr_data.income,
                        "message": f"Income mismatch: Entered ₹{profile.annualIncome:,.2f}, Income says ₹{ocr_data.income:,.2f}"
                    })

        # 3. Category Check
        if "community" in doc_map and doc_map["community"].status != "Mismatch" and doc_map["community"].status != "OCR Failed":
            if not ocr_data.community:
                mismatches.append({
                    "field": "Category", "profile": profile.category, "ocr": "Empty",
                    "message": "Community Verification: Could not parse Category from community certificate."
                })
            elif profile.category:
                norm_ocr = self._normalize_category(ocr_data.community)
                norm_prof = self._normalize_category(profile.category)
                is_match = (
                    norm_ocr == norm_prof or
                    norm_ocr in norm_prof or
                    norm_prof in norm_ocr or
                    (norm_prof in ("bc", "bcm", "obc") and norm_ocr in ("bc", "bcm", "obc")) or
                    (norm_prof in ("mbc", "dnc", "mbc/dnc") and norm_ocr in ("mbc", "dnc", "mbc/dnc"))
                )
                if not is_match:
                    mismatches.append({
                        "field": "Category", "profile": profile.category, "ocr": ocr_data.community,
                        "message": f"Category mismatch: Entered '{profile.category}', Community says '{ocr_data.community}'"
                    })

        # 4. College CGPA Check
        if "college" in doc_map and doc_map["college"].status != "Mismatch" and doc_map["college"].status != "OCR Failed":
            if ocr_data.cgpa is None:
                mismatches.append({
                    "field": "CGPA", "profile": profile.cgpa, "ocr": "Empty",
                    "message": "College Verification: Could not parse CGPA from college document."
                })
            elif profile.cgpa is not None:
                if abs(float(ocr_data.cgpa) - float(profile.cgpa)) > 0.1:
                    mismatches.append({
                        "field": "CGPA", "profile": profile.cgpa, "ocr": ocr_data.cgpa,
                        "message": f"CGPA mismatch: Entered {profile.cgpa}, College ID says {ocr_data.cgpa} (Tolerance: 0.1)"
                    })

        # 5. 10th / 12th Percentage Check
        for doc_type in ("tenth", "twelfth"):
            if doc_type in doc_map and doc_map[doc_type].status != "Mismatch" and doc_map[doc_type].status != "OCR Failed":
                profile_pct = profile.tenthPercentage if doc_type == "tenth" else profile.twelfthPercentage
                if ocr_data.marks is None:
                    mismatches.append({
                        "field": f"{doc_type.capitalize()} percentage", "profile": profile_pct, "ocr": "Empty",
                        "message": f"{doc_type.capitalize()} Verification: Could not calculate percentage from marksheet."
                    })
                elif profile_pct is not None:
                    # Allow 0.5 percentage points tolerance
                    if abs(float(ocr_data.marks) - float(profile_pct)) > 0.5:
                        mismatches.append({
                            "field": f"{doc_type.capitalize()} percentage", "profile": profile_pct, "ocr": ocr_data.marks,
                            "message": f"{doc_type.capitalize()} percentage mismatch: Entered {profile_pct}%, Marksheet calculated {ocr_data.marks}% (Tolerance: 0.5)"
                        })

        # If mismatches exist, we update corresponding documents status to "Mismatch"
        if mismatches:
            for m in mismatches:
                field = m["field"]
                if "cgpa" in field.lower() and "college" in doc_map:
                    doc_map["college"].status = "Mismatch"
                    self.db.add(doc_map["college"])
                elif "income" in field.lower() and "income" in doc_map:
                    doc_map["income"].status = "Mismatch"
                    self.db.add(doc_map["income"])
                elif "category" in field.lower() and "community" in doc_map:
                    doc_map["community"].status = "Mismatch"
                    self.db.add(doc_map["community"])
                elif any(k in field.lower() for k in ("name", "state", "gender", "aadhaar")) and "aadhaar" in doc_map:
                    doc_map["aadhaar"].status = "Mismatch"
                    self.db.add(doc_map["aadhaar"])
                elif "tenth" in field.lower() and "tenth" in doc_map:
                    doc_map["tenth"].status = "Mismatch"
                    self.db.add(doc_map["tenth"])
                elif "twelfth" in field.lower() and "twelfth" in doc_map:
                    doc_map["twelfth"].status = "Mismatch"
                    self.db.add(doc_map["twelfth"])

            self.db.commit()
            return {
                "status": "Mismatch",
                "mismatches": mismatches
            }

        # If no mismatches, promote OCR Completed docs to Verified
        for doc in documents:
            if doc.status == "OCR Completed":
                doc.status = "Verified"
                self.db.add(doc)
        self.db.commit()

        return {
            "status": "Verified",
            "mismatches": []
        }

    def verify_single_document(self, user_id: int, doc: models.Document) -> dict:
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        profile = crud.get_user_profile(self.db, user_id)
        
        extracted_data = {}
        if doc.extracted_data:
            try:
                data = json.loads(doc.extracted_data)
                extracted_data = data.get("extracted_fields") or data
            except Exception:
                pass

        mismatch_fields = {}
        reasons = []

        # 1. Verify Name (required for identity documents)
        if doc.document_type in ("aadhaar", "college", "tenth", "twelfth", "disability", "sportsQuota", "sports", "firstGraduate", "ncc", "nss", "minority"):
            ocr_name = extracted_data.get("name")
            if ocr_name:
                if not self._names_match(user.fullName, ocr_name):
                    mismatch_fields["name"] = {
                        "profile": user.fullName,
                        "ocr": ocr_name,
                        "reason": f"Name mismatch: Entered '{user.fullName}', Document says '{ocr_name}'"
                    }
                    reasons.append(f"Name mismatch: Entered '{user.fullName}', Document says '{ocr_name}'")
            else:
                mismatch_fields["name"] = {
                    "profile": user.fullName,
                    "ocr": "Not Found",
                    "reason": f"Name not extracted from {doc.document_type.capitalize()} document"
                }
                reasons.append(f"Name not found on {doc.document_type.capitalize()}")

        # 2. Document specific checks
        doc_type = doc.document_type
        if doc_type == "aadhaar":
            ocr_gender = extracted_data.get("gender")
            if ocr_gender:
                if self._normalize_gender(ocr_gender) != self._normalize_gender(profile.gender):
                    mismatch_fields["gender"] = {
                        "profile": profile.gender,
                        "ocr": ocr_gender,
                        "reason": f"Gender mismatch: Entered '{profile.gender}', Document says '{ocr_gender}'"
                    }
                    reasons.append(f"Gender mismatch: Entered '{profile.gender}', Document says '{ocr_gender}'")
            else:
                mismatch_fields["gender"] = {
                    "profile": profile.gender,
                    "ocr": "Not Found",
                    "reason": "Gender details not found in Aadhaar card"
                }
                reasons.append("Gender details not found in Aadhaar card")

        elif doc_type == "income":
            ocr_income = extracted_data.get("annual_income") or extracted_data.get("income")
            if ocr_income is not None:
                try:
                    income_val = float(ocr_income)
                    if profile.annualIncome is not None and abs(income_val - profile.annualIncome) > 10.0:
                        mismatch_fields["income"] = {
                            "profile": profile.annualIncome,
                            "ocr": income_val,
                            "reason": f"Income mismatch: Entered ₹{profile.annualIncome:,.2f}, Document says ₹{income_val:,.2f}"
                        }
                        reasons.append(f"Income mismatch: Entered ₹{profile.annualIncome:,.2f}, Document says ₹{income_val:,.2f}")
                except Exception:
                    pass
            else:
                mismatch_fields["income"] = {
                    "profile": profile.annualIncome,
                    "ocr": "Not Found",
                    "reason": "Income details not found in certificate"
                }
                reasons.append("Income details not found in certificate")

        elif doc_type == "community":
            ocr_category = extracted_data.get("category") or extracted_data.get("community")
            if ocr_category:
                norm_ocr = self._normalize_category(ocr_category)
                norm_prof = self._normalize_category(profile.category)
                is_cat_match = (
                    norm_ocr == norm_prof or
                    norm_ocr in norm_prof or
                    norm_prof in norm_ocr or
                    (norm_prof in ("bc", "bcm", "obc") and norm_ocr in ("bc", "bcm", "obc")) or
                    (norm_prof in ("mbc", "dnc", "mbc/dnc") and norm_ocr in ("mbc", "dnc", "mbc/dnc"))
                )
                if not is_cat_match:
                    mismatch_fields["category"] = {
                        "profile": profile.category,
                        "ocr": ocr_category,
                        "reason": f"Category mismatch: Entered '{profile.category}', Document says '{ocr_category}'"
                    }
                    reasons.append(f"Category mismatch: Entered '{profile.category}', Document says '{ocr_category}'")
            else:
                mismatch_fields["category"] = {
                    "profile": profile.category,
                    "ocr": "Not Found",
                    "reason": "Category details not found in community certificate"
                }
                reasons.append("Category details not found in community certificate")

        elif doc_type == "college":
            ocr_cgpa = extracted_data.get("cgpa")
            if ocr_cgpa is not None:
                try:
                    cgpa_val = float(ocr_cgpa)
                    if profile.cgpa is not None and abs(cgpa_val - profile.cgpa) > 0.1:
                        mismatch_fields["cgpa"] = {
                            "profile": profile.cgpa,
                            "ocr": cgpa_val,
                            "reason": f"CGPA mismatch: Entered {profile.cgpa}, College ID says {cgpa_val} (Tolerance: 0.1)"
                        }
                        reasons.append(f"CGPA mismatch: Entered {profile.cgpa}, College ID says {cgpa_val}")
                except Exception:
                    pass
            else:
                mismatch_fields["cgpa"] = {
                    "profile": profile.cgpa,
                    "ocr": "Not Found",
                    "reason": "CGPA Score details not found in College ID"
                }
                reasons.append("CGPA Score details not found in College ID")

        elif doc_type in ("tenth", "twelfth"):
            ocr_pct = extracted_data.get("calculated_percentage") or extracted_data.get("percentage") or extracted_data.get("marks")
            profile_pct = profile.tenthPercentage if doc_type == "tenth" else profile.twelfthPercentage
            if ocr_pct is not None:
                try:
                    pct_val = float(ocr_pct)
                    if profile_pct is not None and abs(pct_val - profile_pct) > 0.5:
                        mismatch_fields["percentage"] = {
                            "profile": profile_pct,
                            "ocr": pct_val,
                            "reason": f"Percentage mismatch: Entered {profile_pct}%, Marksheet calculated {pct_val}% (Tolerance: 0.5)"
                        }
                        reasons.append(f"Percentage mismatch: Entered {profile_pct}%, Marksheet calculated {pct_val}%")
                except Exception:
                    pass
            else:
                mismatch_fields["percentage"] = {
                    "profile": profile_pct,
                    "ocr": "Not Found",
                    "reason": "Percentage details not found or calculated from marksheet"
                }
                reasons.append("Percentage details not found or calculated from marksheet")
 
        elif doc_type == "disability":
            ocr_gender = extracted_data.get("gender")
            if ocr_gender and profile and profile.gender:
                if self._normalize_gender(ocr_gender) != self._normalize_gender(profile.gender):
                    mismatch_fields["gender"] = {
                        "profile": profile.gender,
                        "ocr": ocr_gender,
                        "reason": f"Gender mismatch: Entered '{profile.gender}', Document says '{ocr_gender}'"
                    }
                    reasons.append(f"Gender mismatch: Entered '{profile.gender}', Document says '{ocr_gender}'")

        elif doc_type in ("sportsQuota", "sports"):
            if profile and not getattr(profile, "sportsQuota", False):
                # Note: soft check so verified document can also update profile
                pass

        elif doc_type == "firstGraduate":
            if profile and not getattr(profile, "firstGraduate", False):
                pass

        elif doc_type == "ncc":
            if profile and not getattr(profile, "ncc", False):
                pass

        elif doc_type == "nss":
            if profile and not getattr(profile, "nss", False):
                pass

        elif doc_type == "minority":
            if profile and not getattr(profile, "minority", False):
                pass

        # 3. Document classification mismatch check
        classification_warning = extracted_data.get("classification_warning")
        if classification_warning:
            exp = classification_warning.get("expected")
            rec = classification_warning.get("received")
            if exp and rec and exp != rec and rec not in ("Unknown Document", "Unknown"):
                reasons.append(f"Wrong document uploaded: Expected {exp}, but received {rec}")
                mismatch_fields["document_type"] = {
                    "profile": exp,
                    "ocr": rec,
                    "reason": f"Wrong document uploaded: Expected {exp}, but received {rec}"
                }

        status = "VERIFIED" if not mismatch_fields else "MISMATCH"
        return {
            "status": status,
            "mismatch_fields": mismatch_fields,
            "reasons": reasons
        }
