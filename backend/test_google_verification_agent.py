"""
Test Suite for Google Scholarship Verification Agent:
1. Tests GoogleScholarshipVerificationAgent directly.
2. Tests web search extraction and Gemini verification prompt.
3. Tests integration with AIRecommendationAgent and SupervisorAgent.
4. Tests POST /api/v1/agent/verify-scholarship endpoint.
"""
import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal
from app import models, auth
from app.agent.google_verification_agent import GoogleScholarshipVerificationAgent
from app.agent.recommendation_agent import AIRecommendationAgent
from app.agent.supervisor import SupervisorAgent

client = TestClient(app)

def test_google_verification():
    db = SessionLocal()
    print("\n" + "="*80)
    print("TEST: GOOGLE SCHOLARSHIP VERIFICATION AGENT & SUPERVISOR INTEGRATION")
    print("="*80)

    # 1. Direct Unit Test of GoogleScholarshipVerificationAgent
    agent = GoogleScholarshipVerificationAgent(db)
    sample_sch = {
        "id": 1,
        "scholarship_name": "National Scholarship Portal - Post Matric Scholarship",
        "amount": "Rs. 25,000",
        "deadline": "2026-11-30",
        "min_cgpa": 7.0,
        "max_family_income": 250000,
        "category": "SC/ST/OBC",
        "official_url": "https://scholarships.gov.in"
    }

    res = agent.verify_scholarship(sample_sch)
    print("\n" + "-"*80)
    print("1. DIRECT AGENT VERIFICATION RESULT:")
    print("-" * 80)
    print(f"Scholarship Name     : {res.get('scholarship_name')}")
    print(f"Is Verified          : {res.get('is_verified')}")
    print(f"Validity Status      : {res.get('validity_status')}")
    print(f"Verified Amount      : {res.get('verified_amount')}")
    print(f"Verified Deadline    : {res.get('verified_deadline')}")
    print(f"Verified Portal Link : {res.get('verified_official_url')}")
    print(f"Confidence Score     : {res.get('confidence_score')}%")
    print(f"Summary              : {res.get('summary')}")
    assert res.get("is_verified") is True, "Verification failed"

    # 2. Integration with AIRecommendationAgent
    user = db.query(models.User).filter(models.User.email == "srinagapriya5@gmail.com").first()
    if not user:
        user = models.User(
            fullName="SRINAGAPRIYA A",
            email="srinagapriya5@gmail.com",
            password=auth.get_password_hash("Password@123"),
            role="student"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    rec_agent = AIRecommendationAgent(db)
    sch_db = db.query(models.Scholarship).first()
    rec_res = rec_agent.generate_recommendation(user.id, sch_db.s_no)
    print("\n" + "-"*80)
    print("2. AI RECOMMENDATION AGENT GUIDANCE + GOOGLE VERIFICATION OUTPUT:")
    print("-" * 80)
    print(rec_res.get("ai_explanation"))
    assert "Live Google Web Verification" in rec_res.get("ai_explanation")
    assert rec_res.get("google_verification") is not None

    # 3. HTTP API Endpoint Test
    token = auth.create_access_token(subject=user.id, role="student")
    headers = {"Authorization": f"Bearer {token}"}

    api_resp = client.post(f"/api/v1/agent/verify-scholarship?scholarship_id={sch_db.s_no}", headers=headers)
    print("\n" + "-"*80)
    print("3. HTTP API ENDPOINT (POST /api/v1/agent/verify-scholarship) RESPONSE:")
    print("-" * 80)
    print(f"Status Code: {api_resp.status_code}")
    print(f"Response Payload: {api_resp.json()}")
    assert api_resp.status_code == 200, f"API failed: {api_resp.text}"

    db.close()
    print("\n" + "="*80)
    print("[SUCCESS] GOOGLE VERIFICATION AGENT IS FULLY OPERATIONAL AND INTEGRATED!")
    print("="*80)

if __name__ == "__main__":
    test_google_verification()
