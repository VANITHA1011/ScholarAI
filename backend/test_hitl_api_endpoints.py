import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app import models, crud
from app.database import SessionLocal

def test_hitl_api_endpoints():
    print("=" * 65)
    print("Testing HITL Document Collection FastAPI Endpoints")
    print("=" * 65)

    client = TestClient(app)
    db = SessionLocal()

    # Find or create a test user
    user = db.query(models.User).first()
    if not user:
        user = models.User(fullName="Test Student", email="student@test.com", password="hashedpassword", role="student")
        db.add(user)
        db.commit()
        db.refresh(user)

    user_id = user.id
    db.close()

    # Create an auth token override or mock current user
    from app.main import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    try:
        # 1. Test POST /api/v1/agent/documents/collect/start
        print("\n[1] Testing POST /api/v1/agent/documents/collect/start...")
        res = client.post("/api/v1/agent/documents/collect/start", json={
            "document_type": "tenth",
            "open_browser": False
        })
        print(f"  Status code: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        print(f"  Returned State: {data['state']}")
        print(f"  Official Portal: {data['official_url']}")
        assert data["user_id"] == user_id
        assert data["state"] in ("DOCUMENT_PAGE_FOUND", "SEARCHING", "WEBSITE_OPENED", "HUMAN_VERIFICATION_REQUIRED", "WEBSITE_BLOCKED")
        print("  [OK] Start collection endpoint works successfully.")

        # 2. Test GET /api/v1/agent/documents/collect/status
        print("\n[2] Testing GET /api/v1/agent/documents/collect/status...")
        res = client.get("/api/v1/agent/documents/collect/status?document_type=tenth")
        print(f"  Status code: {res.status_code}")
        assert res.status_code == 200
        data = res.json()
        print(f"  Current State: {data['state']}")
        print("  [OK] Status polling endpoint works successfully.")

        # 3. Test POST /api/v1/agent/documents/collect/verify-human
        print("\n[3] Testing POST /api/v1/agent/documents/collect/verify-human...")
        res = client.post("/api/v1/agent/documents/collect/verify-human", json={
            "document_type": "tenth"
        })
        print(f"  Status code: {res.status_code}")
        assert res.status_code == 200
        data = res.json()
        print(f"  State after confirmation: {data['state']}")
        print("  [OK] Verify human confirmation endpoint works successfully.")

        # 4. Test POST /api/v1/agent/documents/collect/manual
        print("\n[4] Testing POST /api/v1/agent/documents/collect/manual...")
        res = client.post("/api/v1/agent/documents/collect/manual", json={
            "document_type": "tenth"
        })
        print(f"  Status code: {res.status_code}")
        assert res.status_code == 200
        data = res.json()
        print(f"  Manual State: {data['state']}")
        assert data["state"] == "MANUAL_ACCESS_REQUIRED"
        print("  [OK] Manual fallback endpoint works successfully.")

        print("\n" + "=" * 65)
        print("ALL FASTAPI HITL ENDPOINTS PASSED SUCCESSFULLY! [OK]")
        print("=" * 65)

    finally:
        app.dependency_overrides.clear()

if __name__ == "__main__":
    test_hitl_api_endpoints()
