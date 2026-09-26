"""
Deadline Checking and Notification Service for ScholarAI.
Timezone: Asia/Kolkata
Monitors scholarship deadlines and dispatches automated email reminders:
- 7 days before deadline: DEADLINE_7_DAYS
- 3 days before deadline: DEADLINE_3_DAYS
- 1 day before deadline: DEADLINE_1_DAY (Urgent)
- Passed deadline: EXPIRED
Updates scholarship status (ACTIVE, EXPIRING_SOON, EXPIRED) and prevents duplicate notifications.
"""
import re
import logging
from datetime import datetime, date, time
from typing import Optional, List, Dict, Any, Tuple
from zoneinfo import ZoneInfo
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from ..database import SessionLocal
from .. import models
from . import email_service

logger = logging.getLogger(__name__)

KOLKATA_TZ = ZoneInfo("Asia/Kolkata")

# Month name mapping for parsing strings like '31 Oct'
MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}


def parse_scholarship_deadline(deadline_str: str, default_year: int = 2026) -> Optional[datetime]:
    """
    Parses various deadline formats into a timezone-aware datetime in Asia/Kolkata.
    Supported formats:
    - 2026-09-30 23:59:59
    - 2026-09-30
    - 30-09-2026 / 30/09/2026
    - 30 Sep 2026 / September 30, 2026
    - 31 Oct / 31 Oct (state-wise varies) -> defaults to default_year
    """
    if not deadline_str or not isinstance(deadline_str, str):
        return None

    clean_str = deadline_str.strip()
    if clean_str.lower() in ("rolling", "as per notification", "varies", "not specified"):
        return None

    # 1. Try ISO formats: YYYY-MM-DD HH:MM:SS or YYYY-MM-DD
    iso_pattern = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?", clean_str)
    if iso_pattern:
        try:
            y, m, d = int(iso_pattern.group(1)), int(iso_pattern.group(2)), int(iso_pattern.group(3))
            hr = int(iso_pattern.group(4) or 23)
            mi = int(iso_pattern.group(5) or 59)
            sc = int(iso_pattern.group(6) or 59)
            return datetime(y, m, d, hr, mi, sc, tzinfo=KOLKATA_TZ)
        except Exception:
            pass

    # 2. Try DD-MM-YYYY or DD/MM/YYYY
    dmy_pattern = re.search(r"(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[ T](\d{1,2}):(\d{1,2}))?", clean_str)
    if dmy_pattern:
        try:
            d, m, y = int(dmy_pattern.group(1)), int(dmy_pattern.group(2)), int(dmy_pattern.group(3))
            hr = int(dmy_pattern.group(4) or 23)
            mi = int(dmy_pattern.group(5) or 59)
            return datetime(y, m, d, hr, mi, 59, tzinfo=KOLKATA_TZ)
        except Exception:
            pass

    # 3. Try "DD Month YYYY" or "Month DD, YYYY"
    alpha_pattern_with_year = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", clean_str)
    if alpha_pattern_with_year:
        try:
            d = int(alpha_pattern_with_year.group(1))
            m_str = alpha_pattern_with_year.group(2).lower()
            y = int(alpha_pattern_with_year.group(3))
            if m_str in MONTH_MAP:
                return datetime(y, MONTH_MAP[m_str], d, 23, 59, 59, tzinfo=KOLKATA_TZ)
        except Exception:
            pass

    # 4. Try "DD Month" without year: e.g. "31 Oct" or "31 Oct (via NSP)"
    alpha_pattern = re.search(r"(\d{1,2})\s+([A-Za-z]{3,9})", clean_str)
    if alpha_pattern:
        try:
            d = int(alpha_pattern.group(1))
            m_str = alpha_pattern.group(2).lower()
            if m_str in MONTH_MAP:
                return datetime(default_year, MONTH_MAP[m_str], d, 23, 59, 59, tzinfo=KOLKATA_TZ)
        except Exception:
            pass

    # 5. Try "Month YYYY" e.g. "Oct 2026"
    month_year_pattern = re.search(r"([A-Za-z]{3,9})\s+(\d{4})", clean_str)
    if month_year_pattern:
        try:
            m_str = month_year_pattern.group(1).lower()
            y = int(month_year_pattern.group(2))
            if m_str in MONTH_MAP:
                m_num = MONTH_MAP[m_str]
                last_day = 30 if m_num in (4, 6, 9, 11) else (28 if m_num == 2 else 31)
                return datetime(y, m_num, last_day, 23, 59, 59, tzinfo=KOLKATA_TZ)
        except Exception:
            pass

    return None


def calculate_days_remaining(deadline_dt: datetime, current_dt: Optional[datetime] = None) -> int:
    """Calculates remaining full calendar days relative to Asia/Kolkata timezone."""
    now = current_dt or datetime.now(KOLKATA_TZ)
    if now.tzinfo is None:
        now = now.replace(tzinfo=KOLKATA_TZ)
    if deadline_dt.tzinfo is None:
        deadline_dt = deadline_dt.replace(tzinfo=KOLKATA_TZ)

    delta = deadline_dt.date() - now.date()
    return delta.days


def determine_notification_and_status(days_remaining: int) -> Tuple[Optional[str], str]:
    """
    Returns (notification_type, scholarship_status).
    Rules:
    - days_remaining < 0: status EXPIRED, notification EXPIRED
    - days_remaining == 1 or 0: status EXPIRING_SOON, notification DEADLINE_1_DAY
    - days_remaining == 3: status EXPIRING_SOON, notification DEADLINE_3_DAYS
    - days_remaining == 7: status EXPIRING_SOON, notification DEADLINE_7_DAYS
    - 2 <= days_remaining <= 6: status EXPIRING_SOON, no email
    - days_remaining > 7: status ACTIVE, no email
    """
    if days_remaining < 0:
        return "EXPIRED", "EXPIRED"
    elif days_remaining == 0 or days_remaining == 1:
        return "DEADLINE_1_DAY", "EXPIRING_SOON"
    elif days_remaining == 3:
        return "DEADLINE_3_DAYS", "EXPIRING_SOON"
    elif days_remaining == 7:
        return "DEADLINE_7_DAYS", "EXPIRING_SOON"
    elif days_remaining <= 7:
        return None, "EXPIRING_SOON"
    else:
        return None, "ACTIVE"


def get_relevant_students(db: Session, scholarship: models.Scholarship) -> List[models.User]:
    """
    Finds students who should receive deadline notifications for this scholarship:
    1. Students who have submitted/created an application for this scholarship.
    2. Students for whom this scholarship is recommended / eligible.
    3. Students who saved/bookmarked this scholarship.
    Excludes administrator accounts and users without valid email addresses.
    """
    students_map: Dict[int, models.User] = {}

    # 1. Applicants
    apps = db.query(models.Application).filter(models.Application.scholarship_id == scholarship.s_no).all()
    for app in apps:
        if app.user and app.user.email and "admin@" not in app.user.email.lower():
            students_map[app.user.id] = app.user

    # 2. Saved scholarships
    saved = db.query(models.SavedScholarship).filter(models.SavedScholarship.scholarship_id == scholarship.s_no).all()
    for s in saved:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        if user and user.email and "admin@" not in user.email.lower():
            students_map[user.id] = user

    # 3. If no specific applicants or bookmarks, notify active registered students who match this category/state
    if not students_map:
        query = db.query(models.User).filter(
            models.User.email != "admin@scholarship.com",
            models.User.role == "student"
        )
        if scholarship.state and scholarship.state != "All India":
            query = query.join(models.UserProfile, models.UserProfile.user_id == models.User.id).filter(
                models.UserProfile.state == scholarship.state
            )
        candidates = query.limit(10).all()
        for c in candidates:
            if c.email:
                students_map[c.id] = c

    return list(students_map.values())


def check_and_notify_single_scholarship(
    db: Session,
    scholarship: models.Scholarship,
    current_dt: Optional[datetime] = None,
    dry_run: bool = False
) -> Dict[str, Any]:
    """
    Evaluates a single scholarship deadline, updates status, and dispatches notifications.
    Deduplicates notifications to ensure no student receives duplicate emails.
    """
    now = current_dt or datetime.now(KOLKATA_TZ)
    deadline_dt = parse_scholarship_deadline(scholarship.deadline)

    if not deadline_dt:
        return {
            "scholarship_id": scholarship.s_no,
            "scholarship_name": scholarship.scholarship_name,
            "status": scholarship.status or "ACTIVE",
            "days_remaining": None,
            "notification_type": None,
            "students_notified": 0,
            "skipped_duplicates": 0,
            "error": "UNPARSEABLE_DEADLINE"
        }

    days_remaining = calculate_days_remaining(deadline_dt, now)
    notif_type, new_status = determine_notification_and_status(days_remaining)

    # Update scholarship status in database
    if scholarship.status != new_status:
        scholarship.status = new_status
        if not dry_run:
            db.commit()

    if not notif_type:
        return {
            "scholarship_id": scholarship.s_no,
            "scholarship_name": scholarship.scholarship_name,
            "status": new_status,
            "days_remaining": days_remaining,
            "notification_type": None,
            "students_notified": 0,
            "skipped_duplicates": 0
        }

    students = get_relevant_students(db, scholarship)
    sent_count = 0
    skipped_count = 0
    errors = []

    formatted_deadline = deadline_dt.strftime("%d %B %Y")

    for student in students:
        # Check unique constraint (user_id, scholarship_id, notification_type)
        existing = db.query(models.Notification).filter(
            models.Notification.user_id == student.id,
            models.Notification.scholarship_id == scholarship.s_no,
            models.Notification.notification_type == notif_type
        ).first()

        if existing:
            skipped_count += 1
            continue

        if dry_run:
            sent_count += 1
            continue

        # Prepare message text for database record
        if notif_type == "DEADLINE_7_DAYS":
            msg = f"Reminder: The application deadline for {scholarship.scholarship_name} is in 7 days ({formatted_deadline})."
        elif notif_type == "DEADLINE_3_DAYS":
            msg = f"Upcoming Deadline: Only 3 days remain for {scholarship.scholarship_name} ({formatted_deadline})."
        elif notif_type == "DEADLINE_1_DAY":
            msg = f"URGENT: Application deadline for {scholarship.scholarship_name} is TOMORROW ({formatted_deadline})."
        elif notif_type == "EXPIRED":
            msg = f"Notice: Application deadline for {scholarship.scholarship_name} has passed ({formatted_deadline})."
        else:
            msg = f"Deadline update for {scholarship.scholarship_name}."

        try:
            # Send Email
            email_res = email_service.send_automatic_deadline_email(
                notification_type=notif_type,
                student_email=student.email,
                student_name=student.fullName or "Student",
                scholarship_name=scholarship.scholarship_name,
                deadline=formatted_deadline,
                scholarship_id=scholarship.s_no
            )

            # Record in notifications table
            notif_record = models.Notification(
                user_id=student.id,
                scholarship_id=scholarship.s_no,
                title=f"Scholarship Deadline: {scholarship.scholarship_name}",
                notification_type=notif_type,
                message=msg,
                is_read=False,
                sent_at=datetime.now(KOLKATA_TZ),
                status="SENT" if email_res.get("success") else "FAILED",
                created_at=datetime.now(KOLKATA_TZ)
            )
            db.add(notif_record)
            db.commit()

            if email_res.get("success"):
                sent_count += 1
                logger.info(f"[DeadlineService] Sent {notif_type} for '{scholarship.scholarship_name}' to {student.email}")
            else:
                logger.warning(f"[DeadlineService] Email failed for user_id={student.id} sch_id={scholarship.s_no}: {email_res.get('error') or email_res.get('reason')}")
        except Exception as e:
            db.rollback()
            logger.error(f"[DeadlineService] Error notifying student {student.id} for sch {scholarship.s_no}: {e}")
            errors.append(f"user_{student.id}: {str(e)}")

    return {
        "scholarship_id": scholarship.s_no,
        "scholarship_name": scholarship.scholarship_name,
        "status": new_status,
        "days_remaining": days_remaining,
        "notification_type": notif_type,
        "students_notified": sent_count,
        "skipped_duplicates": skipped_count,
        "errors": errors
    }


def check_all_scholarships(db: Session, current_dt: Optional[datetime] = None) -> Dict[str, Any]:
    """
    Iterates through all scholarships and processes deadlines.
    Can be run by scheduler or admin manual trigger.
    """
    now = current_dt or datetime.now(KOLKATA_TZ)
    scholarships = db.query(models.Scholarship).all()

    total = len(scholarships)
    active_cnt = 0
    expiring_cnt = 0
    expired_cnt = 0
    total_emails = 0
    total_skipped = 0
    results = []

    for s in scholarships:
        res = check_and_notify_single_scholarship(db, s, current_dt=now)
        results.append(res)
        if res["status"] == "ACTIVE":
            active_cnt += 1
        elif res["status"] == "EXPIRING_SOON":
            expiring_cnt += 1
        elif res["status"] == "EXPIRED":
            expired_cnt += 1

        total_emails += res.get("students_notified", 0)
        total_skipped += res.get("skipped_duplicates", 0)

    logger.info(f"[DeadlineService] Daily check finished: {total} schemes, {total_emails} emails sent, {total_skipped} skipped.")
    return {
        "timestamp": now.isoformat(),
        "total_scholarships": total,
        "active_scholarships": active_cnt,
        "expiring_soon": expiring_cnt,
        "expired": expired_cnt,
        "total_emails_sent": total_emails,
        "total_skipped_duplicates": total_skipped,
        "details": results
    }


def run_daily_deadline_job():
    """Entrypoint invoked by APScheduler daily at 9:00 AM Kolkata time."""
    logger.info("[DeadlineService] Executing scheduled daily scholarship deadline audit...")
    db = SessionLocal()
    try:
        check_all_scholarships(db)
    except Exception as e:
        logger.error(f"[DeadlineService] Scheduled deadline job encountered an error: {e}", exc_info=True)
    finally:
        db.close()
