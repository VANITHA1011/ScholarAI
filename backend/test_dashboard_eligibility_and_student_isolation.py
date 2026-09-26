import pytest
from app.database import SessionLocal
from app import models, crud, auth
from app.agent.matching_agent import ScholarshipMatchingAgent
from app.agent.google_verification_agent import GoogleScholarshipVerificationAgent

def test_dashboard_eligibility_and_student_isolation():
    db = SessionLocal()
    try:
        total_sch = db.query(models.Scholarship).count()
        assert total_sch == 54, f"Expected 54 scholarships, got {total_sch}"

        # Clean up test users
        db.query(models.User).filter(models.User.email.in_(["newbie_test@scholarship.com", "partial_test@scholarship.com", "rich_test@scholarship.com"])).delete(synchronize_session=False)
        db.commit()

        # =========================================================================
        # CASE 1: New student with no eligibility data
        # =========================================================================
        u1 = models.User(
            fullName="Newbie Student",
            email="newbie_test@scholarship.com",
            password=auth.get_password_hash("Pass@123"),
            role="student"
        )
        db.add(u1)
        db.commit()
        db.refresh(u1)

        matcher = ScholarshipMatchingAgent(db)
        matches1 = matcher.match_scholarships(u1.id)
        
        eligible1 = sum(1 for s in matches1 if s["status"] == "Eligible")
        rejected1 = sum(1 for s in matches1 if s["status"] == "Rejected")
        pending1 = sum(1 for s in matches1 if s["status"] in ("Pending", "Partially Eligible"))

        print(f"\n[CASE 1: Empty Profile Student]")
        print(f"  Total: {len(matches1)}, Eligible: {eligible1}, Rejected: {rejected1}, Pending: {pending1}")
        assert eligible1 == 0, f"Expected 0 eligible for empty profile, got {eligible1}"
        assert rejected1 == 0, f"Expected 0 rejected for empty profile, got {rejected1}"
        assert pending1 == 54, f"Expected 54 pending for empty profile, got {pending1}"

        # =========================================================================
        # CASE 2: Partially completed profile (Only gender and state, no marks or income)
        # =========================================================================
        u2 = models.User(
            fullName="Partial Student",
            email="partial_test@scholarship.com",
            password=auth.get_password_hash("Pass@123"),
            role="student"
        )
        db.add(u2)
        db.commit()
        db.refresh(u2)

        prof2 = models.UserProfile(
            user_id=u2.id,
            gender="Female",
            state="Tamil Nadu",
            degree="B.Sc",
            completionScore=45
        )
        db.add(prof2)
        db.commit()

        matches2 = matcher.match_scholarships(u2.id)
        eligible2 = sum(1 for s in matches2 if s["status"] == "Eligible")
        rejected2 = sum(1 for s in matches2 if s["status"] == "Rejected")
        pending2 = sum(1 for s in matches2 if s["status"] in ("Pending", "Partially Eligible"))

        print(f"\n[CASE 2: Partially Completed Profile (Gender & State only, no income/marks)]")
        print(f"  Total: {len(matches2)}, Eligible: {eligible2}, Rejected: {rejected2}, Pending: {pending2}")
        # Scholarships requiring income or marks must NOT be marked Eligible
        for s in matches2:
            req_types = [c["type"] for c in s.get("criteria", [])]
            if "income" in req_types or "cgpa" in req_types or "percentage" in req_types:
                assert s["status"] != "Eligible", f"Scholarship {s['scholarship_name']} was falsely marked Eligible without income/marks"

        # =========================================================================
        # CASE 3: Complete profile (Eligible for income-constrained schemes)
        # =========================================================================
        prof2.annualIncome = 150000
        prof2.category = "OBC"
        prof2.cgpa = 8.8
        prof2.twelfthPercentage = 88.0
        prof2.completionScore = 100
        db.commit()

        matches3 = matcher.match_scholarships(u2.id)
        eligible3 = sum(1 for s in matches3 if s["status"] == "Eligible")
        rejected3 = sum(1 for s in matches3 if s["status"] == "Rejected")
        pending3 = sum(1 for s in matches3 if s["status"] in ("Pending", "Partially Eligible"))

        print(f"\n[CASE 3: Complete Profile (Income 1.5L, CGPA 8.8, OBC, Female)]")
        print(f"  Total: {len(matches3)}, Eligible: {eligible3}, Rejected: {rejected3}, Pending: {pending3}")
        assert eligible3 > 0, f"Expected positive eligible count for complete profile, got {eligible3}"

        # =========================================================================
        # CASE 4: Student changes family income to 20 Lakhs (Ineligible for income-limited schemes)
        # =========================================================================
        prof2.annualIncome = 2000000
        db.commit()

        matches4 = matcher.match_scholarships(u2.id)
        eligible4 = sum(1 for s in matches4 if s["status"] == "Eligible")
        rejected4 = sum(1 for s in matches4 if s["status"] == "Rejected")
        
        print(f"\n[CASE 4: Income Updated to 20 Lakhs]")
        print(f"  Total: {len(matches4)}, Eligible: {eligible4}, Rejected: {rejected4}")
        assert eligible4 < eligible3, f"Eligible count ({eligible4}) should decrease compared to 1.5L income ({eligible3})"
        assert rejected4 > rejected3, f"Rejected count ({rejected4}) should increase when income exceeds limits"

        # =========================================================================
        # CASE 5: Student isolation (Student 1 must NOT inherit Student 2's counts)
        # =========================================================================
        matches_u1_again = matcher.match_scholarships(u1.id)
        eligible_u1 = sum(1 for s in matches_u1_again if s["status"] == "Eligible")
        rejected_u1 = sum(1 for s in matches_u1_again if s["status"] == "Rejected")
        pending_u1 = sum(1 for s in matches_u1_again if s["status"] in ("Pending", "Partially Eligible"))

        print(f"\n[CASE 5: Student Isolation Check on Student 1]")
        print(f"  Total: {len(matches_u1_again)}, Eligible: {eligible_u1}, Rejected: {rejected_u1}, Pending: {pending_u1}")
        assert eligible_u1 == 0, "Student 1 must remain 0 eligible!"
        assert pending_u1 == 54, "Student 1 must remain 54 pending!"

        # =========================================================================
        # CASE 6: Google Verification does NOT alter MySQL matching counts
        # =========================================================================
        first_sch = db.query(models.Scholarship).first()
        verifier = GoogleScholarshipVerificationAgent(db)
        verif_res = verifier.verify_scholarship({
            "id": first_sch.s_no,
            "scholarship_name": first_sch.scholarship_name,
            "amount": first_sch.amount,
            "deadline": first_sch.deadline
        }, user_id=u2.id)

        # Base matcher must remain unchanged
        matches_after_google = matcher.match_scholarships(u2.id)
        assert len(matches_after_google) == len(matches4)
        assert sum(1 for s in matches_after_google if s["status"] == "Eligible") == eligible4

        print(f"\n[CASE 6: Google Verification Isolation]")
        print(f"  Google Verification returned status: {verif_res.get('verification_status')}")
        print(f"  Base scholarship matching counts remained isolated and unchanged: {eligible4} eligible")

        print("\n" + "="*80)
        print("[ALL 6 TEST CASES PASSED 100% SUCCESSFULLY]")
        print("="*80 + "\n")

    finally:
        # Cleanup
        db.query(models.User).filter(models.User.email.in_(["newbie_test@scholarship.com", "partial_test@scholarship.com", "rich_test@scholarship.com"])).delete(synchronize_session=False)
        db.commit()
        db.close()

if __name__ == "__main__":
    test_dashboard_eligibility_and_student_isolation()
