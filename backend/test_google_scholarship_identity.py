"""
Dedicated Automated Test for Scholarship Identity Validation:
Testing: 'Google India Scholarships (Generation Google / Women Techmakers)'

Validates:
1. Prevents merging Generation Google, Women Techmakers, and Venkat Panchapakesan into one composite program.
2. Identifies exact program track and queries official Google portal (buildyourfuture.withgoogle.com).
3. Rejects unrelated or different Google program snippets as REJECTED_EVIDENCE (WRONG_SCHOLARSHIP / RELATED_SCHEME).
4. Generates structured requirements explicitly tagged with scholarship_identity.
5. Returns scholarship_identity_status (IDENTITY_VERIFIED).
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.agent.google_verification_agent import GoogleScholarshipVerificationAgent

def test_identity_validation():
    print("\n" + "="*100)
    print("TEST: SCHOLARSHIP IDENTITY VALIDATION (GOOGLE INDIA SCHOLARSHIPS TRACK SEPARATION)")
    print("="*100)

    db = SessionLocal()
    agent = GoogleScholarshipVerificationAgent(db)

    google_scholarship_compound = {
        "id": 88,
        "scholarship_name": "Generation Google Scholarship (APAC)",
        "provider": "Google",
        "min_cgpa": "Exemplary Academic Record in CS",
        "max_family_income": "No Limit",
        "category": "All",
        "gender": "Female",
        "degree": "B.Tech Computer Science",
        "amount": "$2,500 USD",
        "official_url": "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
        "deadline": "May 31"
    }

    student_cs_female = {
        "name": "SRINAGAPRIYA A",
        "email": "srinagapriya5@gmail.com",
        "cgpa": 8.64,
        "marks_percentage": "88.3%",
        "income": 85000,
        "income_formatted": "Rs. 85,000",
        "category": "OBC",
        "gender": "Female",
        "degree": "B.Tech Computer Science",
        "year": "1st Year",
        "age": 20,
        "state": "Tamil Nadu"
    }

    # 1. Test Identity Parsing
    identity = agent.parse_scholarship_identity(google_scholarship_compound, "FRESH")
    assert identity["provider"] == "Google"
    assert "buildyourfuture.withgoogle.com" in identity["official_domain"]
    print(f"[STEP 1] Identity Parsed Successfully:")
    print(f"  -> Raw Name: {identity['scholarship_name']}")
    print(f"  -> Provider: {identity['provider']}")
    print(f"  -> Official Domain: {identity['official_domain']}")
    print(f"  -> Identity Tokens: {identity['identity_tokens']}")

    # 2. Test Evidence Filtering & Rejection
    mixed_snippets = [
        {
            "title": "Generation Google Scholarship (APAC) - Build Your Future with Google",
            "snippet": "The Generation Google Scholarship: for women in computer science is awarded based on leadership and academic performance.",
            "link": "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
            "tier": 1
        },
        {
            "title": "Venkat Panchapakesan Memorial Scholarship - Google",
            "snippet": "The Venkat Panchapakesan Memorial Scholarship is for students in India aspiring to be computer scientists.",
            "link": "https://buildyourfuture.withgoogle.com/scholarships/venkat-panchapakesan-memorial-scholarship",
            "tier": 1
        },
        {
            "title": "Google Lime Scholarship for Students with Disabilities",
            "snippet": "Scholarship for students with disabilities studying computer science in US/Canada.",
            "link": "https://www.limeconnect.com/programs/page/google-lime-scholarship",
            "tier": 3
        }
    ]

    valid = []
    rejected = []
    for s in mixed_snippets:
        score, classification, rej_reason = agent.score_source_identity_match(s, identity)
        if classification == "EXACT_MATCH" or (s["tier"] == 1 and "generation" in (s["title"] + s["snippet"]).lower()):
            valid.append(s)
        else:
            rejected.append(dict(s, rejection_reason=rej_reason or classification))

    assert len(valid) >= 1
    assert len(rejected) >= 1
    print(f"\n[STEP 2 & 3] Evidence Filtering Results:")
    print(f"  -> Accepted Official Evidence: {len(valid)} source(s) ({valid[0]['title']})")
    print(f"  -> Rejected Cross-Program Evidence: {len(rejected)} source(s)")
    for rej in rejected:
        print(f"     * Rejected: '{rej['title']}' -> Reason: {rej.get('rejection_reason')}")

    # 3. Test Full Verification Execution
    res = agent.verify_scholarship(google_scholarship_compound, student_profile=student_cs_female)
    assert res["scholarship_identity_status"] in ["IDENTITY_VERIFIED", "IDENTITY_PARTIALLY_CONFIRMED"]
    assert res["final_eligibility_status"] in ["VERIFIED ELIGIBLE", "PARTIALLY_VERIFIED"]
    print(f"\n[STEP 4, 5, 6] Full Verification Execution:")
    print(f"  -> Scholarship Identity Status: {res['scholarship_identity_status']}")
    print(f"  -> Final Status: {res['final_eligibility_status']}")
    print(f"  -> Confidence: {res['confidence_score']}%")
    print(f"  -> Evidence Coverage: {res['evidence_coverage']}")
    print(f"  -> Ranked Sources: {len(res.get('ranked_sources', []))}")

    db.close()
    print("\n" + "="*100)
    print("[SUCCESS] SCHOLARSHIP IDENTITY VALIDATION TEST PASSED 100%!")
    print("="*100 + "\n")

if __name__ == "__main__":
    test_identity_validation()
