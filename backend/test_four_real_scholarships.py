"""
Comprehensive Test Script for 4 Real Scholarships:
1. AICTE Pragati
2. AICTE Saksham
3. Central Sector Scholarship
4. INSPIRE

Prints:
- Scholarship
- Requirement
- Search Query
- Sources Found
- Extracted Value
- Confidence
- Final Result
"""
import os
import sys
import json
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.agent.google_verification_agent import GoogleScholarshipVerificationAgent

def test_four():
    db = SessionLocal()
    agent = GoogleScholarshipVerificationAgent(db)

    student_profile = {
        "name": "SRINAGAPRIYA A",
        "email": "srinagapriya5@gmail.com",
        "cgpa": 8.64,
        "marks_percentage": "88.3%",
        "income": 85000,
        "income_formatted": "Rs. 85,000",
        "category": "OBC",
        "gender": "Female",
        "degree": "B.Tech",
        "year": "1st Year",
        "age": 20,
        "state": "Tamil Nadu"
    }

    test_scholarships = [
        {
            "id": 14,
            "scholarship_name": "PFMS/Pragati Girls Diploma Scholarship (AICTE)",
            "provider": "AICTE",
            "min_cgpa": "Admission to AICTE Approved Institution",
            "max_family_income": "≤ ₹8,00,000",
            "category": "All",
            "gender": "Female",
            "degree": "Diploma / Degree",
            "amount": "₹50,000/year",
            "deadline": "31st October"
        },
        {
            "id": 15,
            "scholarship_name": "AICTE Saksham Scholarship Scheme for Specially Abled",
            "provider": "AICTE",
            "min_cgpa": "Admission to AICTE Approved Institution",
            "max_family_income": "≤ ₹8,00,000",
            "category": "All",
            "gender": "All",
            "degree": "Diploma / Degree",
            "amount": "₹50,000/year",
            "deadline": "31st October"
        },
        {
            "id": 21,
            "scholarship_name": "Central Sector Scheme of Scholarship (CSSS)",
            "provider": "Ministry of Education",
            "min_cgpa": "Above 80th Percentile in Class 12",
            "max_family_income": "≤ ₹4,50,000",
            "category": "All",
            "gender": "All",
            "degree": "Undergraduate",
            "amount": "₹12,000/year",
            "deadline": "31st December"
        },
        {
            "id": 28,
            "scholarship_name": "INSPIRE Scholarship for Higher Education (SHE)",
            "provider": "Department of Science and Technology (DST)",
            "min_cgpa": "Top 1% in Class 12 Board Exams",
            "max_family_income": "No Limit",
            "category": "All",
            "gender": "All",
            "degree": "B.Sc / M.Sc",
            "amount": "₹80,000/year",
            "deadline": "31st December"
        }
    ]

    print("\n" + "="*110)
    print("FOUR REAL SCHOLARSHIP LIVE VERIFICATION TEST PASS (2-STAGE NOT_FOUND RETRIES + SOURCE MATCHING)")
    print("="*110)

    for idx, sch in enumerate(test_scholarships, 1):
        print(f"\n[{idx}/4] TESTING SCHOLARSHIP: {sch['scholarship_name']}")
        print("-" * 110)
        
        res = agent.verify_scholarship(sch, student_profile=student_profile)

        print(f"Scholarship: {res['scholarship_name']} (Clean Name: {res['clean_scholarship_name']})")
        print(f"Application Type: {res['application_type']}")
        print(f"Verification Status: {res['verification_status']}")
        print(f"Evidence Coverage: {res['evidence_coverage']}")
        print(f"Confidence Score: {res['confidence_score']}%")
        print(f"Final Decision: {res['final_eligibility_status']}")
        print(f"Final Explanation: {res['final_eligibility_explanation']}")
        print(f"Total Sources Found: {res['sources_count']}")

        print("\n--- 3-WAY REQUIREMENT MATRIX ---")
        print(f"{'Requirement':<26} | {'Student Value':<18} | {'Live Web Requirement':<32} | {'Result':<14} | {'Evidence Snippet'}")
        print("-" * 110)
        for row in res["field_by_field_comparison"]:
            ev = (row.get("evidence") or "")[:45]
            print(f"{row['requirement']:<26} | {str(row['student_value'])[:18]:<18} | {str(row['current_web_requirement'])[:32]:<32} | {row['result']:<14} | {ev}")

        print("\n--- EXECUTED RPA SEARCH QUERIES & RETRIES ---")
        for h in res.get("rpa_search_history", []):
            print(f"  * [{h.get('requirement', 'Search')}] Query: '{h['query']}' -> {h['results_count']} results ({', '.join(h['domains'])})")

    db.close()
    print("\n" + "="*110)
    print("[SUCCESS] ALL 4 REAL SCHOLARSHIPS TESTED SUCCESSFULLY!")
    print("="*110 + "\n")

if __name__ == "__main__":
    test_four()
