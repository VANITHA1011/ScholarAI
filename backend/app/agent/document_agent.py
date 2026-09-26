from sqlalchemy.orm import Session
import re
from .. import models

class RequiredDocumentAgent:
    """
    Agent 4: Required Document Agent
    Purpose: Determine required documents dynamically based on scholarship requirements.
    """
    def __init__(self, db: Session):
        self.db = db

    def get_required_documents(self, scholarship_id: int) -> list:
        scholarship = self.db.query(models.Scholarship).filter(models.Scholarship.s_no == scholarship_id).first()
        if not scholarship:
            return []

        # Default standard identity documents
        docs = ["aadhaar"]

        # 1. Academic marksheet / college ID
        min_cgpa_str = str(scholarship.min_cgpa or "")
        if min_cgpa_str and min_cgpa_str.lower() not in ("none", "null", "all", "n/a", "-"):
            docs.append("college")
            docs.append("tenth")
            docs.append("twelfth")

        # 2. Income certificate
        inc_digits = re.sub(r'[^\d]', '', str(scholarship.max_family_income or ""))
        if inc_digits and int(inc_digits) < 9999999 and int(inc_digits) > 0:
            docs.append("income")

        # 3. Community certificate
        cat_str = str(scholarship.category or "").lower()
        if cat_str and not any(k in cat_str for k in ("all", "any", "general", "merit")):
            docs.append("community")
        return list(set(docs))

    def get_official_portal(self, document_type: str) -> dict:
        from .document_collector_agent import OFFICIAL_PORTAL_REGISTRY
        doc_key = document_type.lower().strip()
        return OFFICIAL_PORTAL_REGISTRY.get(doc_key, {
            "document_type": doc_key,
            "name": f"{doc_key.capitalize()} Certificate",
            "authority": "National Digital Depository / DigiLocker",
            "official_url": "https://www.digilocker.gov.in/",
            "search_term": f"Download {doc_key.capitalize()} Certificate",
            "requires_otp": False,
            "description": "Official government document and credential portal."
        })

