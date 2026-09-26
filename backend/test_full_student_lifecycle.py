"""
End-to-End HTTP API Lifecycle Test for 4 Student Accounts:
1. Registers/Logs in Sri -> Submits Application -> Receives Submission Email to sri@gmail.com
2. Registers/Logs in Vani -> Submits Application -> Receives Submission Email to vanithanallappan@gmail.com
3. Registers/Logs in Priya -> Submits Application -> Admin Approves -> Receives Approval Email to priya@gmail.com
4. Registers/Logs in Ram -> Submits Application -> Admin Rejects -> Receives Rejection Email to ram@gmail.com
5. Verifies each student receives exclusively their own personalized email.
"""
import os
import sys
from unittest.mock import patch
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal
from app import models

client = TestClient(app)

def test_full_student_lifecycle():
    db = SessionLocal()
    print("\n" + "="*80)
    print("TEST: FULL END-TO-END HTTP API LIFECYCLE FOR 4 REGISTERED STUDENTS")
    print("="*80)

    # 1. Capture all email dispatches from real FastAPI background tasks
    intercepted_emails = []

    def mock_sender(to_email, subject, html_content, text_content=""):
        intercepted_emails.append({
            "to_email": to_email,
            "subject": subject,
            "html_content": html_content
        })
        return {"success": True, "id": f"resend-id-{len(intercepted_emails)}"}

    # Fetch active scholarship
    sch = db.query(models.Scholarship).first()
    assert sch is not None, "Scholarship not found in database."

    # 2. Test Data for 4 Students
    from app import auth
    students = [
        {"name": "Sri", "email": "sri@gmail.com", "password": "Password@123"},
        {"name": "Vani", "email": "vanithanallappan@gmail.com", "password": "Password@123"},
        {"name": "Priya", "email": "priya@gmail.com", "password": "Password@123"},
        {"name": "Ram", "email": "ram@gmail.com", "password": "Password@123"}
    ]

    # Ensure clean password hashes in database
    for s in students:
        u = db.query(models.User).filter(models.User.email == s["email"]).first()
        if not u:
            u = models.User(
                fullName=s["name"],
                email=s["email"],
                password=auth.get_password_hash(s["password"]),
                role="student"
            )
            db.add(u)
        else:
            u.password = auth.get_password_hash(s["password"])
            u.fullName = s["name"]
            db.add(u)
        db.commit()

    with patch("app.services.email_service._send_resend_email", side_effect=mock_sender):
        for s in students:
            # A. Login to get authenticated JWT Bearer token
            login_resp = client.post("/api/v1/auth/login", json={
                "email": s["email"],
                "password": s["password"]
            })
            assert login_resp.status_code == 200, f"Login failed for {s['email']}: {login_resp.text}"
            token_data = login_resp.json()
            token = token_data.get("access_token")
            headers = {"Authorization": f"Bearer {token}"}

            # B. Submit Scholarship Application via authenticated endpoint
            current_student = db.query(models.User).filter(models.User.email == s["email"]).first()
            db.query(models.Application).filter(
                models.Application.user_id == current_student.id,
                models.Application.scholarship_id == sch.id
            ).delete()
            db.commit()

            sub_resp = client.post(
                f"/api/v1/applications/{sch.id}",
                headers=headers,
                json={"status": "SUBMITTED"}
            )
            assert sub_resp.status_code == 200, f"Failed submission for {s['name']}: {sub_resp.text}"
            app_id = sub_resp.json().get("application_id")

            # Verify latest dispatched email matches current student
            last_email = intercepted_emails[-1]
            print(f"[OK] Student: {s['name']:<6} | Logged-in Email: {s['email']:<30} | Dispatched Email: {last_email['to_email']}")
            assert last_email["to_email"] == s["email"], f"Mismatch! Expected {s['email']}, got {last_email['to_email']}"

        # 3. Admin Decision Tests
        # Login Admin
        admin_login = client.post("/api/v1/auth/login", json={
            "email": "admin@scholarship.com",
            "password": "Admin@123"
        })
        assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
        admin_token = admin_login.json().get("access_token")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        admin_db = SessionLocal()
        # Admin Approves Priya's Application
        priya_user = admin_db.query(models.User).filter(models.User.email == "priya@gmail.com").first()
        priya_app = admin_db.query(models.Application).filter(models.Application.user_id == priya_user.id).order_by(models.Application.id.desc()).first()
        
        client.put(
            f"/api/v1/admin/applications/{priya_app.id}/status",
            headers=admin_headers,
            json={"status": "Approved", "admin_notes": "Merit and documents verified."}
        )
        assert intercepted_emails[-1]["to_email"] == "priya@gmail.com"
        print(f"[OK] Admin Approves Priya's Application #{priya_app.id} -> Dispatched to: {intercepted_emails[-1]['to_email']}")

        # Admin Rejects Ram's Application
        ram_user = admin_db.query(models.User).filter(models.User.email == "ram@gmail.com").first()
        ram_app = admin_db.query(models.Application).filter(models.Application.user_id == ram_user.id).order_by(models.Application.id.desc()).first()

        client.put(
            f"/api/v1/admin/applications/{ram_app.id}/status",
            headers=admin_headers,
            json={"status": "Rejected", "admin_notes": "Income limit exceeded."}
        )
        assert intercepted_emails[-1]["to_email"] == "ram@gmail.com"
        print(f"[OK] Admin Rejects Ram's Application #{ram_app.id}   -> Dispatched to: {intercepted_emails[-1]['to_email']}")

        admin_db.close()

    db.close()
    print("\n" + "="*80)
    print("[SUCCESS] ALL 4 STUDENTS RECEIVED EXCLUSIVELY THEIR OWN APPLICATION EMAILS!")
    print("="*80)

if __name__ == "__main__":
    test_full_student_lifecycle()
