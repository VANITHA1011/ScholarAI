"""
Rigorous Automated Test Suite for Google Verification Agent
Validating all user-requested test scenarios:
TEST 1: DB Rule = Google Rule = Student Eligible -> ELIGIBLE
TEST 2: DB Rule conflicts with official Google Rule -> DB_CONFLICT
TEST 3: Google cannot find a requirement -> NOT_FOUND / UNVERIFIED
TEST 4: Student fails officially verified requirement -> INELIGIBLE
TEST 5: Some requirements verified, some missing -> PARTIALLY_VERIFIED
TEST 6: Fresh vs Renewal requirement differentiation
TEST 7: Serper API failure / missing key -> Graceful fallback, no crash
TEST 8: Strict evaluation priority
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.agent.google_verification_agent import GoogleScholarshipVerificationAgent

def run_suite():
    print("\n" + "="*95)
    print("RIGOROUS TEST SUITE: GOOGLE VERIFICATION AGENT & 3-WAY DECISION ENGINE")
    print("="*95)

    db = SessionLocal()
    agent = GoogleScholarshipVerificationAgent(db)
    passed = 0
    total = 8

    student_eligible = {
        "name": "SRINAGAPRIYA A",
        "email": "srinagapriya5@gmail.com",
        "cgpa": 8.64,
        "marks_percentage": "88.3%",
        "income": 85000,
        "income_formatted": "Rs. 85,000",
        "category": "OBC",
        "gender": "Female",
        "degree": "B.Sc",
        "year": "1st Year",
        "age": 20,
        "state": "Tamil Nadu"
    }

    top_source = {
        "link": "https://scholarships.gov.in/",
        "title": "National Scholarship Portal"
    }

    # ----------------------------------------------------------------------
    # TEST 1: Database rule = Google rule = Student eligible -> ELIGIBLE
    # ----------------------------------------------------------------------
    print("\n[TEST 1] DB Rule = Google Rule = Student Eligible -> Expect ELIGIBLE...")
    sch_csss = {
        "scholarship_name": "Central Sector Scheme of Scholarship",
        "min_cgpa": "Top 20th percentile",
        "max_family_income": "450000",
        "category": "All",
        "gender": "All",
        "degree": "Undergraduate",
        "age_limit": "17–22 years"
    }
    web_csss = {
        "min_marks_cgpa": "Above 80th percentile in Class 12",
        "max_family_income": "≤ ₹4,50,000 per annum",
        "eligible_category": "All Categories",
        "gender_requirement": "Any / All",
        "eligible_degree": "Regular Undergraduate degree",
        "age_limit": "17–22 years"
    }
    res1 = agent.evaluate_three_way_matrix("Central Sector Scheme of Scholarship", sch_csss, student_eligible, web_csss, top_source, "FRESH")
    assert res1["final_eligibility_status"] == "VERIFIED ELIGIBLE", f"Expected VERIFIED ELIGIBLE, got {res1['final_eligibility_status']}"
    print(f"  -> Result: {res1['final_eligibility_status']} (Status: {res1['verification_status']}, Confidence: {res1['confidence_score']}%)")
    print("  -> PASS [1/8]")
    passed += 1

    # ----------------------------------------------------------------------
    # TEST 2: DB Rule conflicts with official Google Rule -> DB_CONFLICT
    # ----------------------------------------------------------------------
    print("\n[TEST 2] Database Rule Conflicts with Official Live Google Rule -> Expect DB CONFLICT...")
    sch_conflict = {
        "scholarship_name": "CBSE Single Girl Child Scholarship",
        "min_cgpa": ">=50%",
        "max_family_income": "≤ ₹2,50,000", # Conflict with Google 8L
        "gender": "Female",
        "degree": "Class 11-12"
    }
    web_conflict = {
        "min_marks_cgpa": ">=50%",
        "max_family_income": "≤ ₹8,00,000 per annum",
        "eligible_category": "All Categories",
        "gender_requirement": "Female only",
        "eligible_degree": "Class 11-12",
        "age_limit": "NOT_FOUND"
    }
    res2 = agent.evaluate_three_way_matrix("CBSE Single Girl Child Scholarship", sch_conflict, student_eligible, web_conflict, top_source, "FRESH")
    assert res2["final_eligibility_status"] == "DB_CONFLICT", f"Got {res2['final_eligibility_status']}"
    has_conflict_flag = any(r.get("has_db_conflict") for r in res2["matrix"])
    print(f"  -> Conflict Detected: {has_conflict_flag}, Final Status: {res2['final_eligibility_status']}")
    print("  -> PASS [2/8]")
    passed += 1

    # ----------------------------------------------------------------------
    # TEST 3: Google cannot find a requirement -> NOT_FOUND / UNVERIFIED
    # ----------------------------------------------------------------------
    print("\n[TEST 3] Google Cannot Find a Requirement (NOT_FOUND) -> Expect UNVERIFIED (Never assume eligible)...")
    sch_sparse = {"scholarship_name": "Test Scheme", "max_family_income": "No Limit"}
    web_sparse = {"max_family_income": "NOT_FOUND", "min_marks_cgpa": "NOT_FOUND"}
    res3 = agent.evaluate_three_way_matrix("Test Scheme", sch_sparse, student_eligible, web_sparse, top_source, "FRESH")
    income_row = next(r for r in res3["matrix"] if r["requirement"] == "Annual Family Income")
    assert income_row["result"] == "UNVERIFIED", "NOT_FOUND must result in UNVERIFIED"
    print(f"  -> Web requirement 'NOT_FOUND' correctly evaluated as: '{income_row['result']}'")
    print("  -> PASS [3/8]")
    passed += 1

    # ----------------------------------------------------------------------
    # TEST 4: Student fails an officially verified requirement -> INELIGIBLE
    # ----------------------------------------------------------------------
    print("\n[TEST 4] Student Fails Officially Verified Requirement -> Expect INELIGIBLE...")
    student_low_marks = dict(student_eligible, marks_percentage="45%", cgpa=4.5)
    sch_high_cutoff = {
        "scholarship_name": "KVPY Fellowship",
        "min_cgpa": ">=75%",
        "max_family_income": "No Limit",
        "degree": "B.Sc"
    }
    web_high_cutoff = {
        "min_marks_cgpa": ">=75% cutoff marks",
        "max_family_income": "No Limit",
        "eligible_category": "All",
        "gender_requirement": "Any",
        "eligible_degree": "B.Sc",
        "age_limit": "NOT_FOUND"
    }
    res4 = agent.evaluate_three_way_matrix("KVPY Fellowship", sch_high_cutoff, student_low_marks, web_high_cutoff, top_source, "FRESH")
    assert res4["final_eligibility_status"] == "INELIGIBLE"
    print(f"  -> Evaluated student with 45% marks against ≥75% cutoff -> Result: {res4['final_eligibility_status']}")
    print("  -> PASS [4/8]")
    passed += 1

    # ----------------------------------------------------------------------
    # TEST 5: Some requirements verified and some missing -> PARTIALLY_VERIFIED
    # ----------------------------------------------------------------------
    print("\n[TEST 5] Partial Verification Evidence -> Expect PARTIALLY_VERIFIED (Never claim 100%)...")
    web_partial = {
        "min_marks_cgpa": "Above 80th percentile",
        "max_family_income": "NOT_FOUND",
        "eligible_category": "NOT_FOUND",
        "gender_requirement": "Any",
        "eligible_degree": "NOT_FOUND",
        "age_limit": "NOT_FOUND"
    }
    res5 = agent.evaluate_three_way_matrix("Partial Scheme", sch_csss, student_eligible, web_partial, top_source, "FRESH")
    assert res5["final_eligibility_status"] == "PARTIALLY_VERIFIED", f"Expected PARTIALLY_VERIFIED, got {res5['final_eligibility_status']}"
    print(f"  -> Evidence Coverage: {res5['evidence_coverage']} -> Status: {res5['final_eligibility_status']}")
    print("  -> PASS [5/8]")
    passed += 1

    # ----------------------------------------------------------------------
    # TEST 6: Fresh vs Renewal Requirements Differ
    # ----------------------------------------------------------------------
    print("\n[TEST 6] Fresh vs Renewal Application Type Differentiation...")
    student_1st_year = dict(student_eligible, year="1st Year")
    student_3rd_year = dict(student_eligible, year="3rd Year")
    sch_test = {"scholarship_name": "Post-Matric Scholarship"}
    type_1 = agent.determine_application_type(sch_test, student_1st_year)
    type_3 = agent.determine_application_type(sch_test, student_3rd_year)
    assert type_1 == "FRESH", f"Expected FRESH, got {type_1}"
    assert type_3 == "RENEWAL", f"Expected RENEWAL, got {type_3}"
    print(f"  -> 1st Year Student inferred as: {type_1}")
    print(f"  -> 3rd Year Student inferred as: {type_3}")
    print("  -> PASS [6/8]")
    passed += 1

    # ----------------------------------------------------------------------
    # TEST 7: Serper API Failure / Missing Key -> Graceful Fallback
    # ----------------------------------------------------------------------
    print("\n[TEST 7] Serper API Failure / Missing Key Handling...")
    real_key = os.environ.get("SERPER_API_KEY")
    os.environ["SERPER_API_KEY"] = ""
    snippets_fallback = agent.search_web_serper("NonExistentQueryTest123")
    assert isinstance(snippets_fallback, list), "Expected list response on failure"
    os.environ["SERPER_API_KEY"] = real_key
    print(f"  -> Handled empty/failed API response gracefully without application crash.")
    print("  -> PASS [7/8]")
    passed += 1

    # ----------------------------------------------------------------------
    # TEST 8: Age Disqualification Override (Student Age 14 vs 17-22)
    # ----------------------------------------------------------------------
    print("\n[TEST 8] Age Disqualification Override (Student 14 vs 17-22)...")
    student_underage = dict(student_eligible, age=14)
    res8 = agent.evaluate_three_way_matrix("Higher Scheme", sch_csss, student_underage, web_csss, top_source, "FRESH")
    assert res8["final_eligibility_status"] == "INELIGIBLE"
    print(f"  -> Final Status: {res8['final_eligibility_status']} (Age row failed)")
    print("  -> PASS [8/8]")
    passed += 1

    db.close()
    print("\n" + "="*95)
    print(f"[SUCCESS] {passed}/{total} RIGOROUS VERIFICATION TEST CASES PASSED WITH 100% SUCCESS!")
    print("="*95 + "\n")

if __name__ == "__main__":
    run_suite()
