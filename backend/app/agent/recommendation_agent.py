from sqlalchemy.orm import Session
from .. import models, crud
from .matching_agent import ScholarshipMatchingAgent

class AIRecommendationAgent:
    """
    Agent 7: AI Recommendation Agent
    Purpose: Provides application readiness and detailed guidance explanations when verification succeeds.
    """
    def __init__(self, db: Session):
        self.db = db
        self.matcher = ScholarshipMatchingAgent(db)

    def generate_recommendation(self, user_id: int, scholarship_id: int) -> dict:
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        profile = crud.get_user_profile(self.db, user_id)
        
        # Get matching results from Matching Agent
        matches = self.matcher.match_scholarships(user_id)
        selected_match = next((m for m in matches if m["id"] == scholarship_id), None)

        # Query scholarship data from database
        sch = self.db.query(models.Scholarship).filter(models.Scholarship.s_no == scholarship_id).first()

        if not selected_match:
            return {
                "status": "Error",
                "ai_explanation": "Selected scholarship details could not be matched."
            }

        reasons = selected_match.get("reasons", [])
        eligible_reasons = [r for r in reasons if "✔" in r]
        rejected_reasons = [r for r in reasons if "❌" in r]

        # Generate guidance text
        user_name = user.fullName if user else "Student"
        explanation = f"Congratulations {user_name}! All profile and document verification checks passed.\n\n"
        
        explanation += "### 🎯 Why You Are Eligible:\n"
        for r in eligible_reasons:
            explanation += f"- {r}\n"

        if rejected_reasons:
            explanation += "\n### ⚠️ Potential Caveats:\n"
            for r in rejected_reasons:
                explanation += f"- {r}\n"

        explanation += "\n### 🚀 Next Steps:\n"
        explanation += "1. Review all terms and document attachments.\n"
        explanation += "2. Click 'Confirm & Submit' to submit your verified application."

        return {
            "status": "Ready",
            "match_percentage": selected_match.get("match_percentage", 100),
            "ai_explanation": explanation
        }
