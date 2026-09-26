import os
import sys
from dotenv import load_dotenv
load_dotenv()

from app.services import email_service
from fastapi.testclient import TestClient
from app.main import app

def test_email_service_functions():
    print("--- 1. Testing Email Service Functions ---")
    
    # Test submission email
    res1 = email_service.send_application_submitted_email(
        student_email="delivered@resend.dev",
        student_name="Srinath",
        scholarship_name="Google Generation Scholarship",
        application_id=101
    )
    print("Submitted Email Result:", res1)
    
    # Test approval email
    res2 = email_service.send_application_approved_email(
        student_email="delivered@resend.dev",
        student_name="Srinath",
        scholarship_name="Google Generation Scholarship",
        application_id=101,
        grant_amount="Rs. 1,00,000",
        admin_notes="All documents verified successfully."
    )
    print("Approved Email Result:", res2)
    
    # Test rejection email
    res3 = email_service.send_application_rejected_email(
        student_email="delivered@resend.dev",
        student_name="Srinath",
        scholarship_name="National Scholarship",
        application_id=102,
        rejection_reason="Family income exceeds the scheme threshold."
    )
    print("Rejected Email Result:", res3)
    
    # Test review email
    res4 = email_service.send_application_review_email(
        student_email="delivered@resend.dev",
        student_name="Srinath",
        scholarship_name="National Scholarship",
        application_id=102,
        admin_notes="Awaiting community certificate verification."
    )
    print("Review Email Result:", res4)
    
    # Test deadline reminder email
    res5 = email_service.send_deadline_reminder_email(
        student_email="delivered@resend.dev",
        student_name="Srinath",
        scholarship_name="Merit-cum-Means Scheme",
        days_remaining=3,
        deadline_date="August 31, 2026"
    )
    print("Deadline Reminder Email Result:", res5)


def test_api_status_update_with_email():
    print("\n--- 2. Testing Admin Status Update Flow ---")
    client = TestClient(app)
    
    # Login admin
    admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin@scholarship.com",
        "password": "Admin@123"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Fetch first application
    apps_res = client.get("/api/v1/admin/applications", headers=headers)
    apps = apps_res.json()
    if not apps:
        print("No applications found in DB to test status update.")
        return
        
    first_app = apps[0]
    app_id = first_app["id"]
    print(f"Testing status update on Application #{app_id} (Student: {first_app['student']['fullName']})...")
    
    # Update to Under Review
    res = client.put(f"/api/v1/admin/applications/{app_id}/status", json={
        "status": "Under Review",
        "admin_notes": "Verifying original documents"
    }, headers=headers)
    print("Update status response:", res.status_code, res.json())
    assert res.status_code == 200
    assert res.json()["status"] == "Under Review"
    
    print("\nALL NOTIFICATION TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    test_email_service_functions()
    test_api_status_update_with_email()
