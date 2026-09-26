"""
Automated Test Suite for the 6 Exact User Test Cases:
CASE 1: Student age 14, MySQL age Open, Google age 17–22 -> Age = INELIGIBLE, Final = INELIGIBLE
CASE 2: Student income ₹565,656, MySQL income No Limit, Google income NOT_FOUND -> Income = UNVERIFIED (NOT ELIGIBLE)
CASE 3: MySQL income ₹2,50,000, Google income ₹8,00,000 -> Income = DB_CONFLICT
CASE 4: MySQL course UG/PG, Google course UG/PG, Student M.Sc -> Course = ELIGIBLE
CASE 5: All mandatory criteria verified and passed -> Final = VERIFIED ELIGIBLE
CASE 6: One mandatory criterion verified failed -> Final = INELIGIBLE regardless of other passing criteria
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.agent.google_verification_agent import GoogleScholarshipVerificationAgent

def test_six_cases():
    print("\n" + "="*95)
    print("VERIFICATION SUITE: 6 EXACT LOGICAL TEST CASES")
    print("="*95)

    db = SessionLocal()
    agent = GoogleScholarshipVerificationAgent(db)
    passed = 0

    top_source = {
        "link": "https://scholarships.gov.in/",
        "title": "National Scholarship Portal"
    }

    # --------------------------------------------------------------------------
    # CASE 1: Student age 14, MySQL age Open, Google age 17–22 -> Age=INELIGIBLE, Final=INELIGIBLE
    # --------------------------------------------------------------------------
    print("\n[CASE 1] Student age 14 | MySQL age Open | Google age 17–22...")
    student_c1 = {
        "name": "Underage Student",
        "age": 14,
        "marks_percentage": "95%",
        "cgpa": 9.5,
        "income": 100000,
        "income_formatted": "Rs. 1,00,000",
        "category": "OBC",
        "gender": "Female",
        "degree": "Class 9",
        "year": "1st Year"
    }
    db_c1 = {
        "scholarship_name": "Higher Education Scheme",
        "age_limit": "Open",
        "min_cgpa": ">=60%",
        "max_family_income": "≤ ₹8,00,000",
        "category": "All",
        "gender": "All",
        "degree": "Undergraduate"
    }
    web_c1 = {
        "age_limit": "17–22 years",
        "min_marks_cgpa": "≥60% in Class 12",
        "max_family_income": "≤ ₹8,00,000 per annum",
        "eligible_category": "All Categories",
        "gender_requirement": "Any / All",
        "eligible_degree": "Undergraduate"
    }
    res_c1 = agent.evaluate_three_way_matrix("Higher Education Scheme", db_c1, student_c1, web_c1, top_source, "FRESH")
    age_row = next(r for r in res_c1["matrix"] if r["requirement"] == "Age Limit Requirement")
    assert age_row["result"] == "INELIGIBLE", f"Expected Age = INELIGIBLE, got {age_row['result']}"
    assert res_c1["final_eligibility_status"] == "INELIGIBLE", f"Expected Final = INELIGIBLE, got {res_c1['final_eligibility_status']}"
    print(f"  -> Age Row Result: {age_row['result']} ({age_row['evidence']})")
    print(f"  -> Overall Final Decision: {res_c1['final_eligibility_status']}")
    print("  -> PASS [Case 1/6]")
    passed += 1

    # --------------------------------------------------------------------------
    # CASE 2: Student income ₹565,656, MySQL income No Limit, Google income NOT_FOUND -> UNVERIFIED
    # --------------------------------------------------------------------------
    print("\n[CASE 2] Student income ₹565,656 | MySQL income No Limit | Google income NOT_FOUND...")
    student_c2 = {
        "name": "Student C2",
        "age": 20,
        "marks_percentage": "85%",
        "cgpa": 8.5,
        "income": 565656,
        "income_formatted": "Rs. 5,65,656",
        "category": "General",
        "gender": "Female",
        "degree": "B.Sc",
        "year": "1st Year"
    }
    db_c2 = {
        "scholarship_name": "Merit Fellowship",
        "max_family_income": "No Limit",
        "min_cgpa": ">=70%",
        "category": "All",
        "gender": "All",
        "degree": "Undergraduate"
    }
    web_c2 = {
        "max_family_income": "NOT_FOUND",
        "min_marks_cgpa": "≥70%",
        "eligible_category": "All Categories",
        "gender_requirement": "Any / All",
        "eligible_degree": "Undergraduate",
        "age_limit": "NOT_FOUND"
    }
    res_c2 = agent.evaluate_three_way_matrix("Merit Fellowship", db_c2, student_c2, web_c2, top_source, "FRESH")
    income_row = next(r for r in res_c2["matrix"] if r["requirement"] == "Annual Family Income")
    assert income_row["result"] == "UNVERIFIED", f"Expected Income = UNVERIFIED, got {income_row['result']}"
    assert income_row["result"] != "ELIGIBLE", "NOT_FOUND must NOT be marked ELIGIBLE"
    print(f"  -> Income Row Result: {income_row['result']} ({income_row['evidence']})")
    print("  -> PASS [Case 2/6]")
    passed += 1

    # --------------------------------------------------------------------------
    # CASE 3: MySQL income ₹2,50,000, Google income ₹8,00,000 -> DB_CONFLICT
    # --------------------------------------------------------------------------
    print("\n[CASE 3] MySQL income ₹2,50,000 | Google income ₹8,00,000 -> DB_CONFLICT...")
    db_c3 = {
        "scholarship_name": "State Post-Matric",
        "max_family_income": "≤ ₹2,50,000",
        "min_cgpa": ">=50%",
        "category": "All",
        "gender": "All",
        "degree": "Undergraduate"
    }
    web_c3 = {
        "max_family_income": "≤ ₹8,00,000 per annum",
        "min_marks_cgpa": ">=50%",
        "eligible_category": "All Categories",
        "gender_requirement": "Any / All",
        "eligible_degree": "Undergraduate",
        "age_limit": "NOT_FOUND"
    }
    res_c3 = agent.evaluate_three_way_matrix("State Post-Matric", db_c3, student_c2, web_c3, top_source, "FRESH")
    income_c3_row = next(r for r in res_c3["matrix"] if r["requirement"] == "Annual Family Income")
    assert income_c3_row["result"] == "DB CONFLICT", f"Expected DB CONFLICT, got {income_c3_row['result']}"
    assert income_c3_row["has_db_conflict"] is True
    print(f"  -> Income Row Result: {income_c3_row['result']} ({income_c3_row['evidence']})")
    print("  -> PASS [Case 3/6]")
    passed += 1

    # --------------------------------------------------------------------------
    # CASE 4: MySQL course UG/PG, Google course UG/PG, Student M.Sc -> Course = ELIGIBLE
    # --------------------------------------------------------------------------
    print("\n[CASE 4] MySQL course UG/PG | Google course UG/PG | Student M.Sc -> Course = ELIGIBLE...")
    student_msc = {
        "name": "PG Student",
        "age": 22,
        "marks_percentage": "82%",
        "cgpa": 8.2,
        "income": 120000,
        "income_formatted": "Rs. 1,20,000",
        "category": "OBC",
        "gender": "Female",
        "degree": "M.Sc",
        "year": "1st Year"
    }
    db_c4 = {
        "scholarship_name": "Higher Education Merit Scheme",
        "degree": "Undergraduate/Postgraduate (UG/PG)",
        "min_cgpa": ">=60%",
        "max_family_income": "≤ ₹8,00,000",
        "category": "All",
        "gender": "All"
    }
    web_c4 = {
        "eligible_degree": "Undergraduate / Postgraduate (UG/PG)",
        "min_marks_cgpa": ">=60%",
        "max_family_income": "≤ ₹8,00,000",
        "eligible_category": "All Categories",
        "gender_requirement": "Any / All",
        "age_limit": "NOT_FOUND"
    }
    res_c4 = agent.evaluate_three_way_matrix("Higher Education Merit Scheme", db_c4, student_msc, web_c4, top_source, "FRESH")
    deg_row = next(r for r in res_c4["matrix"] if r["requirement"] == "Course / Degree Level")
    assert deg_row["result"] == "ELIGIBLE", f"Expected Course = ELIGIBLE, got {deg_row['result']}"
    print(f"  -> Course Row Result: {deg_row['result']} ({deg_row['evidence']})")
    print("  -> PASS [Case 4/6]")
    passed += 1

    # --------------------------------------------------------------------------
    # CASE 5: All mandatory criteria verified and passed -> Final = VERIFIED ELIGIBLE
    # --------------------------------------------------------------------------
    print("\n[CASE 5] All Mandatory Criteria Verified & Passed -> Final = VERIFIED ELIGIBLE...")
    student_c5 = {
        "name": "SRINAGAPRIYA A",
        "age": 20,
        "marks_percentage": "88.3%",
        "cgpa": 8.64,
        "income": 85000,
        "income_formatted": "Rs. 85,000",
        "category": "OBC",
        "gender": "Female",
        "degree": "B.Sc",
        "year": "1st Year"
    }
    db_c5 = {
        "scholarship_name": "Central Sector Scheme of Scholarship",
        "min_cgpa": "Top 20th percentile",
        "max_family_income": "≤ ₹4,50,000",
        "category": "All",
        "gender": "All",
        "degree": "Undergraduate",
        "age_limit": "17–22 years"
    }
    web_c5 = {
        "min_marks_cgpa": "Above 80th percentile in Class 12",
        "max_family_income": "≤ ₹4,50,000 per annum",
        "eligible_category": "All Categories",
        "gender_requirement": "Any / All",
        "eligible_degree": "Regular Undergraduate degree",
        "age_limit": "17–22 years"
    }
    res_c5 = agent.evaluate_three_way_matrix("Central Sector Scheme of Scholarship", db_c5, student_c5, web_c5, top_source, "FRESH")
    assert res_c5["final_eligibility_status"] == "VERIFIED ELIGIBLE", f"Expected VERIFIED ELIGIBLE, got {res_c5['final_eligibility_status']}"
    print(f"  -> Final Status: {res_c5['final_eligibility_status']}")
    print(f"  -> Explanation: {res_c5['final_eligibility_explanation']}")
    print("  -> PASS [Case 5/6]")
    passed += 1

    # --------------------------------------------------------------------------
    # CASE 6: One mandatory criterion verified as failed -> Final = INELIGIBLE
    # --------------------------------------------------------------------------
    print("\n[CASE 6] One Mandatory Criterion Verified Failed -> Final = INELIGIBLE (Hard failure override)...")
    # Low marks student (50%) against 80% cutoff
    student_c6 = dict(student_c5, marks_percentage="50%", cgpa=5.0)
    res_c6 = agent.evaluate_three_way_matrix("Central Sector Scheme of Scholarship", db_c5, student_c6, web_c5, top_source, "FRESH")
    assert res_c6["final_eligibility_status"] == "INELIGIBLE", f"Expected INELIGIBLE, got {res_c6['final_eligibility_status']}"
    print(f"  -> Final Status: {res_c6['final_eligibility_status']}")
    print(f"  -> Explanation: {res_c6['final_eligibility_explanation']}")
    print("  -> PASS [Case 6/6]")
    passed += 1

    db.close()
    print("\n" + "="*95)
    print(f"[SUCCESS] {passed}/6 EXACT SPECIFICATION TEST CASES PASSED WITH 100% SUCCESS!")
    print("="*95 + "\n")

if __name__ == "__main__":
    test_six_cases()
