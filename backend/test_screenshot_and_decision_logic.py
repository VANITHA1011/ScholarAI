"""
Dedicated Automated Test Suite for Decision-State & UI Logic:
Validates all 10 specific rules plus the exact Tamil Nadu First Graduate screenshot case.

Rules:
1. All requirements verified -> VERIFIED
2. 1/2 requirements verified -> PARTIALLY_VERIFIED
3. NOT_FOUND must never become ELIGIBLE
4. Official source exists but specific requirement is missing -> UNVERIFIED (Evidence: Official source found, requirement not explicitly stated)
5. Verified mandatory failure -> INELIGIBLE
6. Identity VERIFIED + requirement NOT_FOUND -> PARTIALLY_VERIFIED
7. MySQL/Google conflict -> DB CONFLICT
8. NOT_APPLICABLE requirement is excluded from evidence coverage
9. No applicable evidence -> UNVERIFIED
10. Final eligibility must not claim VERIFIED ELIGIBLE when mandatory criteria are missing
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.agent.google_verification_agent import GoogleScholarshipVerificationAgent

def test_decision_logic():
    print("\n" + "="*110)
    print("TEST SUITE: GOOGLE VERIFICATION DECISION-STATE & UI LOGIC")
    print("="*110)

    db = SessionLocal()
    agent = GoogleScholarshipVerificationAgent(db)

    # ---------------------------------------------------------------------------------------------
    # EXACT SCREENSHOT CASE: Tamil Nadu First Graduate Scholarship
    # ---------------------------------------------------------------------------------------------
    print("\n[CASE 0: EXACT SCREENSHOT TEST] Tamil Nadu First Graduate Scholarship...")
    sch_tn = {
        "id": 101,
        "scholarship_name": "Tamil Nadu First Graduate Fee Concession",
        "provider": "Directorate of Technical Education TN",
        "min_cgpa": "Open / Merit",
        "first_generation": "Yes"
    }

    student_tn_no_fg = {
        "name": "SRINAGAPRIYA A",
        "email": "srinagapriya5@gmail.com",
        "cgpa": 8.64,
        "marks_percentage": "88.3%",
        "first_generation": "No",
        "state": "Tamil Nadu"
    }

    web_tn_extracted = {
        "academic_marks": "NOT_FOUND",
        "first_generation": "First Graduate Certificate Required"
    }

    top_gov_source = [{
        "title": "TNDTE First Graduate Official Portal",
        "link": "https://www.tndte.gov.in/first-graduate",
        "tier": 1,
        "identity_match_score": 95,
        "source_classification": "EXACT_MATCH"
    }]

    eval_tn = agent.evaluate_three_way_matrix(
        identity=sch_tn["scholarship_name"],
        db_details=sch_tn,
        student_data=student_tn_no_fg,
        web_extracted=web_tn_extracted,
        valid_sources=top_gov_source,
        applicable_reqs=["academic_marks", "first_generation"],
        identity_status="IDENTITY_VERIFIED"
    )

    # Validate Row 1 (Academic Marks)
    row_marks = next(r for r in eval_tn["matrix"] if "Academic Marks" in r["requirement"])
    assert row_marks["result"] == "UNVERIFIED"
    assert "Official source found, but academic marks requirement was not explicitly established" in row_marks["evidence"]
    print(f"  -> Academic Marks: Result = {row_marks['result']} | Evidence: '{row_marks['evidence']}'")

    # Validate Row 2 (First Generation)
    row_fg = next(r for r in eval_tn["matrix"] if "First Generation" in r["requirement"])
    assert row_fg["result"] == "INELIGIBLE"
    assert "Student does not satisfy First Generation requirement" in row_fg["evidence"]
    print(f"  -> First Generation: Result = {row_fg['result']} | Evidence: '{row_fg['evidence']}'")

    # Validate Overall Decision State
    assert eval_tn["verification_status"] == "PARTIALLY_VERIFIED"
    assert eval_tn["final_eligibility_status"] == "INELIGIBLE"
    assert eval_tn["evidence_coverage"] == "1/2"
    assert "First Generation Status" in eval_tn["final_eligibility_explanation"]
    print(f"  -> Verification Status: {eval_tn['verification_status']}")
    print(f"  -> Final Eligibility: {eval_tn['final_eligibility_status']}")
    print(f"  -> Evidence Coverage: {eval_tn['evidence_coverage']} Criteria")
    print(f"  -> Explanation: {eval_tn['final_eligibility_explanation']}")
    print("  -> PASS [Screenshot Case]")

    # ---------------------------------------------------------------------------------------------
    # RULE 1: All requirements verified -> VERIFIED
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 1] All requirements verified -> VERIFIED...")
    eval_r1 = agent.evaluate_three_way_matrix(
        identity="National Merit Scheme",
        db_details={"min_cgpa": ">=60%", "max_family_income": "800000"},
        student_data={"marks_percentage": "85%", "cgpa": 8.5, "income": 200000},
        web_extracted={"academic_marks": ">=60% marks", "family_income": "<= Rs. 8,00,000"},
        valid_sources=top_gov_source,
        applicable_reqs=["academic_marks", "family_income"],
        identity_status="IDENTITY_VERIFIED"
    )
    assert eval_r1["verification_status"] == "VERIFIED"
    assert eval_r1["final_eligibility_status"] == "VERIFIED ELIGIBLE"
    assert eval_r1["evidence_coverage"] == "2/2"
    print(f"  -> Status: {eval_r1['verification_status']} | Final: {eval_r1['final_eligibility_status']}")
    print("  -> PASS [Rule 1]")

    # ---------------------------------------------------------------------------------------------
    # RULE 2: 1/2 requirements verified -> PARTIALLY_VERIFIED
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 2] 1/2 requirements verified -> PARTIALLY_VERIFIED...")
    eval_r2 = agent.evaluate_three_way_matrix(
        identity="National Merit Scheme",
        db_details={"min_cgpa": ">=60%", "max_family_income": "800000"},
        student_data={"marks_percentage": "85%", "cgpa": 8.5, "income": 200000},
        web_extracted={"academic_marks": ">=60% marks", "family_income": "NOT_FOUND"},
        valid_sources=top_gov_source,
        applicable_reqs=["academic_marks", "family_income"],
        identity_status="IDENTITY_VERIFIED"
    )
    assert eval_r2["verification_status"] == "PARTIALLY_VERIFIED"
    assert eval_r2["final_eligibility_status"] == "PARTIALLY_VERIFIED"
    assert eval_r2["evidence_coverage"] == "1/2"
    print(f"  -> Status: {eval_r2['verification_status']} | Final: {eval_r2['final_eligibility_status']}")
    print("  -> PASS [Rule 2]")

    # ---------------------------------------------------------------------------------------------
    # RULE 3: NOT_FOUND must never become ELIGIBLE
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 3] NOT_FOUND must never become ELIGIBLE...")
    res_r3, _, _ = agent._eval_single_field("Income", 200000, "800000", "NOT_FOUND", "income", "Portal")
    assert res_r3 == "UNVERIFIED"
    assert res_r3 != "ELIGIBLE"
    print(f"  -> Result for NOT_FOUND: {res_r3}")
    print("  -> PASS [Rule 3]")

    # ---------------------------------------------------------------------------------------------
    # RULE 4: Official source exists but requirement missing -> UNVERIFIED with explanatory evidence
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 4] Official source exists but requirement missing -> UNVERIFIED with explicit text...")
    res_r4, _, ev_r4 = agent._eval_single_field("Academic Marks", 88.3, "Open", "NOT_FOUND", "percentage", "Official AICTE Portal")
    assert res_r4 == "UNVERIFIED"
    assert "Official source found, but academic marks requirement was not explicitly established" in ev_r4
    print(f"  -> Result: {res_r4} | Evidence: {ev_r4}")
    print("  -> PASS [Rule 4]")

    # ---------------------------------------------------------------------------------------------
    # RULE 5: Verified mandatory failure -> INELIGIBLE (Hard failure override)
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 5] Verified mandatory failure -> INELIGIBLE...")
    eval_r5 = agent.evaluate_three_way_matrix(
        identity="Pragati Scholarship",
        db_details={"gender": "Female only"},
        student_data={"gender": "Male"},
        web_extracted={"gender": "Female / Girl students only"},
        valid_sources=top_gov_source,
        applicable_reqs=["gender"],
        identity_status="IDENTITY_VERIFIED"
    )
    assert eval_r5["final_eligibility_status"] == "INELIGIBLE"
    assert "Gender Requirement" in eval_r5["final_eligibility_explanation"]
    print(f"  -> Final: {eval_r5['final_eligibility_status']} | Explanation: {eval_r5['final_eligibility_explanation']}")
    print("  -> PASS [Rule 5]")

    # ---------------------------------------------------------------------------------------------
    # RULE 6: Identity VERIFIED + requirement NOT_FOUND -> PARTIALLY_VERIFIED
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 6] Identity VERIFIED + requirement NOT_FOUND -> PARTIALLY_VERIFIED...")
    eval_r6 = agent.evaluate_three_way_matrix(
        identity="CSSS Scholarship",
        db_details={"min_cgpa": "Top 20th percentile", "max_family_income": "450000"},
        student_data={"marks_percentage": "92%", "cgpa": 9.2, "income": 150000},
        web_extracted={"academic_marks": "Above 80th percentile in Class 12", "family_income": "NOT_FOUND"},
        valid_sources=top_gov_source,
        applicable_reqs=["academic_marks", "family_income"],
        identity_status="IDENTITY_VERIFIED"
    )
    assert eval_r6["verification_status"] == "PARTIALLY_VERIFIED"
    print(f"  -> Identity Status: IDENTITY_VERIFIED | Verification Status: {eval_r6['verification_status']}")
    print("  -> PASS [Rule 6]")

    # ---------------------------------------------------------------------------------------------
    # RULE 7: MySQL/Google conflict -> DB CONFLICT
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 7] MySQL/Google conflict -> DB CONFLICT...")
    res_r7, has_conf_r7, ev_r7 = agent._eval_single_field("Income", 85000, "250000", "800000", "income", "Portal")
    assert res_r7 == "DB CONFLICT"
    assert has_conf_r7 is True
    print(f"  -> Result: {res_r7} | Conflict Detected: {has_conf_r7}")
    print("  -> PASS [Rule 7]")

    # ---------------------------------------------------------------------------------------------
    # RULE 8: NOT_APPLICABLE requirement is excluded from evidence coverage
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 8] NOT_APPLICABLE requirement excluded from dynamic discovery...")
    reqs_inspire = agent.discover_scholarship_requirements({
        "scholarship_name": "INSPIRE Scholarship SHE",
        "max_family_income": "No Limit",
        "gender": "All"
    })
    assert "family_income" not in reqs_inspire
    assert "gender" not in reqs_inspire
    print(f"  -> Discovered Applicable Criteria: {reqs_inspire}")
    print("  -> PASS [Rule 8]")

    # ---------------------------------------------------------------------------------------------
    # RULE 9: No applicable evidence -> UNVERIFIED
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 9] No applicable evidence -> UNVERIFIED...")
    eval_r9 = agent.evaluate_three_way_matrix(
        identity="Unknown Local Scheme",
        db_details={"min_cgpa": "Open"},
        student_data={"marks_percentage": "80%", "cgpa": 8.0},
        web_extracted={"academic_marks": "NOT_FOUND"},
        valid_sources=[],
        applicable_reqs=["academic_marks"],
        identity_status="SCHOLARSHIP_IDENTITY_UNVERIFIED"
    )
    assert eval_r9["verification_status"] == "UNVERIFIED"
    print(f"  -> Verification Status: {eval_r9['verification_status']}")
    print("  -> PASS [Rule 9]")

    # ---------------------------------------------------------------------------------------------
    # RULE 10: Final eligibility must not claim VERIFIED ELIGIBLE when mandatory criteria missing
    # ---------------------------------------------------------------------------------------------
    print("\n[RULE 10] Incomplete evidence never claims VERIFIED ELIGIBLE...")
    assert eval_r2["final_eligibility_status"] != "VERIFIED ELIGIBLE"
    assert eval_r2["final_eligibility_status"] == "PARTIALLY_VERIFIED"
    print(f"  -> Final Status with missing criteria: {eval_r2['final_eligibility_status']}")
    print("  -> PASS [Rule 10]")

    db.close()
    print("\n" + "="*110)
    print("[SUCCESS] ALL 10 DECISION-STATE SPECIFICATIONS + SCREENSHOT CASE PASSED 100%!")
    print("="*110 + "\n")

if __name__ == "__main__":
    test_decision_logic()
