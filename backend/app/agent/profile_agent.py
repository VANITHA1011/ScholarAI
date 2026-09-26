from sqlalchemy.orm import Session
from .. import models, crud

class ProfileAgent:
    """
    Agent 1: Profile Agent
    Purpose: Collect and validate student profile.
    """
    def __init__(self, db: Session):
        self.db = db

    def validate_profile(self, user_id: int) -> dict:
        user = self.db.query(models.User).filter(models.User.id == user_id).first()
        profile = crud.get_user_profile(self.db, user_id)

        if not user:
            return {
                "status": "Incomplete",
                "missing_fields": ["user_record"],
                "errors": ["User record not found."]
            }

        # Check core required fields
        checks = {
            "Name": user.fullName,
            "Gender": profile.gender,
            "Category": profile.category,
            "Income": profile.annualIncome,
            "Degree": profile.degree,
            "Department": profile.department,
            "State": profile.state,
            "Current Year": profile.year,
            "CGPA": profile.cgpa,
            "10th %": profile.tenthPercentage,
            "12th %": profile.twelfthPercentage
        }

        missing_fields = []
        errors = []

        for field_name, value in checks.items():
            if value is None or str(value).strip() == "":
                missing_fields.append(field_name)

        # Value range checks if fields are present
        if profile.cgpa is not None:
            try:
                cgpa_val = float(profile.cgpa)
                if cgpa_val < 0.0 or cgpa_val > 10.0:
                    errors.append("CGPA must be between 0.0 and 10.0.")
            except ValueError:
                errors.append("Invalid CGPA format.")

        if profile.annualIncome is not None:
            try:
                income_val = float(profile.annualIncome)
                if income_val < 0:
                    errors.append("Annual Income cannot be negative.")
            except ValueError:
                errors.append("Invalid Annual Income format.")

        if profile.tenthPercentage is not None:
            try:
                tenth_val = float(profile.tenthPercentage)
                if tenth_val < 0.0 or tenth_val > 100.0:
                    errors.append("10th percentage must be between 0.0 and 100.0.")
            except ValueError:
                errors.append("Invalid 10th percentage format.")

        if profile.twelfthPercentage is not None:
            try:
                twelfth_val = float(profile.twelfthPercentage)
                if twelfth_val < 0.0 or twelfth_val > 100.0:
                    errors.append("12th percentage must be between 0.0 and 100.0.")
            except ValueError:
                errors.append("Invalid 12th percentage format.")

        if profile.age is not None:
            try:
                age_val = int(profile.age)
                if age_val < 0 or age_val > 120:
                    errors.append("Age must be a valid positive number.")
            except ValueError:
                errors.append("Invalid Age format.")

        if missing_fields or errors:
            return {
                "status": "Incomplete",
                "missing_fields": missing_fields,
                "errors": errors
            }

        return {
            "status": "Complete",
            "missing_fields": [],
            "errors": []
        }
