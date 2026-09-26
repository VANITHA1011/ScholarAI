"""
Comprehensive automated tests for ScholarAI Scholarship Deadline & Email Notification System.
Tests all 7 scenarios specified in requirements:
TEST 1: Scholarship deadline = today + 7 days -> DEADLINE_7_DAYS
TEST 2: Scholarship deadline = today + 3 days -> DEADLINE_3_DAYS
TEST 3: Scholarship deadline = today + 1 day  -> DEADLINE_1_DAY
TEST 4: Scholarship deadline = yesterday      -> Scholarship status = EXPIRED
TEST 5: Run scheduler twice for the same scholarship -> Deduplicated, only ONE email
TEST 6: Two different students applied to same scholarship -> Both receive appropriate email
TEST 7: Student has not applied and is not eligible/recommended -> No email
"""
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app import models
from app.services import deadline_service, email_service

KOLKATA_TZ = deadline_service.KOLKATA_TZ

def run_all_tests():
    db: Session = SessionLocal()
    print("=" * 65)
    print("SCHOLARAI SCHOLARSHIP DEADLINE & NOTIFICATION TEST SUITE")
    print("=" * 65)

    try:
        now = datetime.now(KOLKATA_TZ)
        today = now.date()

        # Create/Get Test Students
        student1 = db.query(models.User).filter(models.User.email == "test_student_1@scholarship.com").first()
        if not student1:
            student1 = models.User(
                fullName="Keerthi Applicant",
                email="test_student_1@scholarship.com",
                password="TestPassword@123",
                role="student"
            )
            db.add(student1)
            db.commit()
            db.refresh(student1)

        student2 = db.query(models.User).filter(models.User.email == "test_student_2@scholarship.com").first()
        if not student2:
            student2 = models.User(
                fullName="Srinath Candidate",
                email="test_student_2@scholarship.com",
                password="TestPassword@123",
                role="student"
            )
            db.add(student2)
            db.commit()
            db.refresh(student2)

        # Helper to create/reset a test scholarship
        def setup_test_scholarship(name: str, deadline_dt: datetime) -> models.Scholarship:
            sch = db.query(models.Scholarship).filter(models.Scholarship.scholarship_name == name).first()
            if not sch:
                sch = models.Scholarship(
                    scholarship_name=name,
                    provider="Test Government Agency",
                    degree="Engineering",
                    amount="Rs. 50,000",
                    deadline=deadline_dt.strftime("%Y-%m-%d %H:%M:%S"),
                    status="ACTIVE"
                )
                db.add(sch)
                db.commit()
                db.refresh(sch)
            else:
                sch.deadline = deadline_dt.strftime("%Y-%m-%d %H:%M:%S")
                sch.status = "ACTIVE"
                db.commit()
            # Clean past test notifications for this scholarship
            db.query(models.Notification).filter(models.Notification.scholarship_id == sch.s_no).delete()
            # Clean applications
            db.query(models.Application).filter(models.Application.scholarship_id == sch.s_no).delete()
            db.commit()
            return sch

        # ----------------------------------------------------
        # TEST 1: Scholarship deadline = today + 7 days
        # ----------------------------------------------------
        print("\n[TEST 1] Scholarship deadline = today + 7 days")
        d7 = datetime.combine(today + timedelta(days=7), datetime.min.time().replace(hour=23, minute=59, second=59), tzinfo=KOLKATA_TZ)
        sch1 = setup_test_scholarship("Test Scholarship 7 Days", d7)
        # Add application for student 1
        db.add(models.Application(user_id=student1.id, scholarship_id=sch1.s_no, status="Applied"))
        db.commit()

        res1 = deadline_service.check_and_notify_single_scholarship(db, sch1, current_dt=now)
        print("  Notification Type:", res1["notification_type"])
        print("  Status:", res1["status"])
        print("  Students Notified:", res1["students_notified"])
        assert res1["notification_type"] == "DEADLINE_7_DAYS", f"Expected DEADLINE_7_DAYS, got {res1['notification_type']}"
        assert res1["status"] == "EXPIRING_SOON", f"Expected EXPIRING_SOON, got {res1['status']}"
        assert res1["students_notified"] == 1
        print("  -> TEST 1 PASSED: DEADLINE_7_DAYS email sent successfully.")

        # ----------------------------------------------------
        # TEST 2: Scholarship deadline = today + 3 days
        # ----------------------------------------------------
        print("\n[TEST 2] Scholarship deadline = today + 3 days")
        d3 = datetime.combine(today + timedelta(days=3), datetime.min.time().replace(hour=23, minute=59, second=59), tzinfo=KOLKATA_TZ)
        sch2 = setup_test_scholarship("Test Scholarship 3 Days", d3)
        db.add(models.Application(user_id=student1.id, scholarship_id=sch2.s_no, status="Applied"))
        db.commit()

        res2 = deadline_service.check_and_notify_single_scholarship(db, sch2, current_dt=now)
        print("  Notification Type:", res2["notification_type"])
        print("  Status:", res2["status"])
        assert res2["notification_type"] == "DEADLINE_3_DAYS", f"Expected DEADLINE_3_DAYS, got {res2['notification_type']}"
        assert res2["status"] == "EXPIRING_SOON"
        assert res2["students_notified"] == 1
        print("  -> TEST 2 PASSED: DEADLINE_3_DAYS email sent successfully.")

        # ----------------------------------------------------
        # TEST 3: Scholarship deadline = today + 1 day
        # ----------------------------------------------------
        print("\n[TEST 3] Scholarship deadline = today + 1 day")
        d1 = datetime.combine(today + timedelta(days=1), datetime.min.time().replace(hour=23, minute=59, second=59), tzinfo=KOLKATA_TZ)
        sch3 = setup_test_scholarship("Test Scholarship 1 Day", d1)
        db.add(models.Application(user_id=student1.id, scholarship_id=sch3.s_no, status="Applied"))
        db.commit()

        res3 = deadline_service.check_and_notify_single_scholarship(db, sch3, current_dt=now)
        print("  Notification Type:", res3["notification_type"])
        print("  Status:", res3["status"])
        assert res3["notification_type"] == "DEADLINE_1_DAY", f"Expected DEADLINE_1_DAY, got {res3['notification_type']}"
        assert res3["status"] == "EXPIRING_SOON"
        assert res3["students_notified"] == 1
        print("  -> TEST 3 PASSED: DEADLINE_1_DAY urgent email sent successfully.")

        # ----------------------------------------------------
        # TEST 4: Scholarship deadline = yesterday
        # ----------------------------------------------------
        print("\n[TEST 4] Scholarship deadline = yesterday")
        d_yesterday = datetime.combine(today - timedelta(days=1), datetime.min.time().replace(hour=23, minute=59, second=59), tzinfo=KOLKATA_TZ)
        sch4 = setup_test_scholarship("Test Scholarship Expired", d_yesterday)
        db.add(models.Application(user_id=student1.id, scholarship_id=sch4.s_no, status="Applied"))
        db.commit()

        res4 = deadline_service.check_and_notify_single_scholarship(db, sch4, current_dt=now)
        print("  Notification Type:", res4["notification_type"])
        print("  Status:", res4["status"])
        assert res4["notification_type"] == "EXPIRED", f"Expected EXPIRED, got {res4['notification_type']}"
        assert res4["status"] == "EXPIRED", f"Expected EXPIRED status, got {res4['status']}"
        print("  -> TEST 4 PASSED: Scholarship status marked as EXPIRED.")

        # ----------------------------------------------------
        # TEST 5: Run scheduler twice for the same scholarship
        # ----------------------------------------------------
        print("\n[TEST 5] Run scheduler twice for same scholarship (Deduplication Check)")
        # Second run for sch3 (1 day)
        res5 = deadline_service.check_and_notify_single_scholarship(db, sch3, current_dt=now)
        print("  First Run Notified:", res3["students_notified"])
        print("  Second Run Notified:", res5["students_notified"])
        print("  Second Run Skipped Duplicates:", res5["skipped_duplicates"])
        assert res5["students_notified"] == 0, "Duplicate email was erroneously sent!"
        assert res5["skipped_duplicates"] >= 1, "Duplicate notification was not detected!"
        print("  -> TEST 5 PASSED: Exactly ONE email sent; duplicate run safely skipped.")

        # ----------------------------------------------------
        # TEST 6: Two different students applied to the same scholarship
        # ----------------------------------------------------
        print("\n[TEST 6] Two different students applied to same scholarship")
        d3_multi = datetime.combine(today + timedelta(days=3), datetime.min.time().replace(hour=23, minute=59, second=59), tzinfo=KOLKATA_TZ)
        sch6 = setup_test_scholarship("Test Scholarship Multi-Applicant", d3_multi)
        # Student 1 applies
        db.add(models.Application(user_id=student1.id, scholarship_id=sch6.s_no, status="Applied"))
        # Student 2 applies
        db.add(models.Application(user_id=student2.id, scholarship_id=sch6.s_no, status="Applied"))
        db.commit()

        res6 = deadline_service.check_and_notify_single_scholarship(db, sch6, current_dt=now)
        print("  Total Applicants Notified:", res6["students_notified"])
        assert res6["students_notified"] == 2, f"Expected 2 students notified, got {res6['students_notified']}"
        print("  -> TEST 6 PASSED: Both applied students received notifications.")

        # ----------------------------------------------------
        # TEST 7: Student has not applied and is not eligible/recommended
        # ----------------------------------------------------
        print("\n[TEST 7] Student has not applied and is not eligible/recommended")
        # sch6 has student1 and student2. Check if a 3rd unrelated user receives anything.
        student3 = db.query(models.User).filter(models.User.email == "unrelated_student@scholarship.com").first()
        if not student3:
            student3 = models.User(
                fullName="Unrelated Student",
                email="unrelated_student@scholarship.com",
                password="TestPassword@123",
                role="student"
            )
            db.add(student3)
            db.commit()
            db.refresh(student3)

        notifs_for_unrelated = db.query(models.Notification).filter(
            models.Notification.user_id == student3.id,
            models.Notification.scholarship_id == sch6.s_no
        ).all()
        print("  Notifications for unrelated user:", len(notifs_for_unrelated))
        assert len(notifs_for_unrelated) == 0, "Unrelated student received an email!"
        print("  -> TEST 7 PASSED: Unrelated student received NO email.")

        print("\n" + "=" * 65)
        print("ALL 7 TEST SCENARIOS PASSED WITH 100% SUCCESS!")
        print("=" * 65)

    finally:
        db.close()

if __name__ == "__main__":
    run_all_tests()
