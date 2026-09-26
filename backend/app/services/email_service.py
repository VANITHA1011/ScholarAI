"""
Email Service module using Brevo Transactional Email API.
Handles automated student email notifications for scholarship applications and administrative decisions.
Strictly sends emails to the authenticated student's registered email address.
"""
import os
import json
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from dotenv import load_dotenv

# Ensure .env is always loaded
load_dotenv()

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
RESEND_API_URL = "https://api.resend.com/emails"


def get_smtp_config():
    """Retrieve SMTP configuration safely from environment."""
    host = os.getenv("SMTP_HOST", "").strip()
    port_str = os.getenv("SMTP_PORT", "587").strip()
    try:
        port = int(port_str)
    except ValueError:
        port = 587
    user = os.getenv("SMTP_USERNAME", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    from_email = os.getenv("SMTP_FROM_EMAIL", user or "noreply@scholarai.com").strip()
    return host, port, user, password, from_email


def get_brevo_config():
    """Retrieve Brevo API configuration safely from environment."""
    api_key = os.getenv("BREVO_API_KEY", "").strip()
    sender_email = os.getenv("BREVO_SENDER_EMAIL", "srinagapriya5@gmail.com").strip()
    sender_name = os.getenv("BREVO_SENDER_NAME", "ScholarAI Platform").strip()
    return api_key, sender_email, sender_name


def get_resend_config():
    """Retrieve Resend API configuration safely from environment as backup."""
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    from_email = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev").strip()
    test_email = os.getenv("RESEND_TEST_EMAIL", "").strip()
    return api_key, from_email, test_email


def check_email_service_configuration():
    """Diagnostic check run at backend startup to inspect email service status."""
    host, port, user, _, from_email = get_smtp_config()
    if host and user:
        logger.info(f"[EmailService] SMTP Service Active (Host: {host}:{port}, User: {user}).")
        return {"status": "ACTIVE", "provider": "SMTP", "sender": from_email}

    brevo_key, sender_email, sender_name = get_brevo_config()
    if brevo_key:
        logger.info(f"[EmailService] Brevo Transactional API Active (Sender: {sender_name} <{sender_email}>).")
        return {"status": "ACTIVE", "provider": "BREVO", "sender": sender_email}
    
    resend_key, resend_from, _ = get_resend_config()
    if resend_key:
        logger.info(f"[EmailService] Resend API Active (Sender: {resend_from}).")
        return {"status": "ACTIVE", "provider": "RESEND", "sender": resend_from}
        
    logger.warning("[EmailService] No email provider configured. Outgoing emails disabled.")
    return {"status": "DISABLED", "provider": None, "sender": None}


def _send_smtp_email(to_email: str, subject: str, html_content: str, text_content: str = "", student_name: str = "Student") -> dict:
    """
    Dispatches email via standard SMTP server using credentials from environment variables.
    """
    host, port, user, password, from_email = get_smtp_config()
    if not host or not user or not password:
        return {"success": False, "reason": "SMTP_NOT_CONFIGURED"}

    if not to_email or not str(to_email).strip():
        logger.warning("[EmailService] [SMTP] No student recipient email provided.")
        return {"success": False, "reason": "NO_RECIPIENT"}

    target_email = str(to_email).strip()
    target_name = str(student_name).strip() if student_name else "Student"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"ScholarAI Platform <{from_email}>"
    msg["To"] = f"{target_name} <{target_email}>"

    if text_content:
        msg.attach(MIMEText(text_content, "plain", "utf-8"))
    if html_content:
        msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=12)
        else:
            server = smtplib.SMTP(host, port, timeout=12)
            server.starttls()
        server.login(user, password)
        server.send_message(msg)
        server.quit()
        logger.info(f"[EmailService] [SMTP] Successfully sent '{subject}' to {target_email}")
        return {"success": True, "provider": "SMTP"}
    except Exception as e:
        logger.error(f"[EmailService] [SMTP] Failed delivery to {target_email}: {e}")
        return {"success": False, "error": str(e), "provider": "SMTP"}


def send_unified_email(to_email: str, subject: str, html_content: str, text_content: str = "", student_name: str = "Student") -> dict:
    """
    Resilient email dispatcher:
    1. Tries SMTP if SMTP credentials are provided in .env
    2. Falls back to Brevo Transactional API if Brevo key is configured
    3. Falls back to Resend API if Resend key is configured
    """
    host, _, user, password, _ = get_smtp_config()
    if host and user and password:
        res = _send_smtp_email(to_email, subject, html_content, text_content, student_name)
        if res.get("success"):
            return res
        logger.warning(f"[EmailService] SMTP failed ({res.get('error')}), falling back to Brevo...")

    brevo_key, _, _ = get_brevo_config()
    if brevo_key:
        return _send_brevo_email(to_email, subject, html_content, text_content, student_name)

    resend_key, _, _ = get_resend_config()
    if resend_key:
        return _send_resend_fallback(to_email, subject, html_content, text_content)

    return {"success": False, "reason": "NO_EMAIL_PROVIDER_CONFIGURED"}


def _send_brevo_email(to_email: str, subject: str, html_content: str, text_content: str = "", student_name: str = "Student") -> dict:
    """
    Dispatches transactional email via Brevo API (https://api.brevo.com/v3/smtp/email).
    Guaranteed not to throw unhandled exceptions or disrupt application submission.
    Never logs or leaks API keys.
    """
    brevo_key, sender_email, sender_name = get_brevo_config()

    if not brevo_key:
        # Check fallback to Resend if Brevo is not configured
        resend_key, _, _ = get_resend_config()
        if resend_key:
            logger.info("[EmailService] Brevo key missing, routing via Resend fallback.")
            return _send_resend_fallback(to_email, subject, html_content, text_content)
        logger.warning("[EmailService] BREVO_API_KEY not configured. Skipping email dispatch.")
        return {"success": False, "reason": "NO_API_KEY"}

    if not to_email or not str(to_email).strip():
        logger.warning("[EmailService] No student recipient email provided. Skipping email dispatch.")
        return {"success": False, "reason": "NO_RECIPIENT"}

    target_email = str(to_email).strip()
    target_name = str(student_name).strip() if student_name else "Student"

    payload = {
        "sender": {
            "name": sender_name,
            "email": sender_email
        },
        "to": [
            {
                "email": target_email,
                "name": target_name
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }
    if text_content:
        payload["textContent"] = text_content

    headers = {
        "api-key": brevo_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "ScholarAI-NotificationService/1.0"
    }

    max_attempts = 2
    last_error = ""
    for attempt in range(1, max_attempts + 1):
        # 1. Try requests library
        try:
            import requests
            response = requests.post(
                BREVO_API_URL,
                json=payload,
                headers=headers,
                timeout=(8, 15)
            )
            if response.status_code in (200, 201, 202):
                res_json = response.json() if response.text else {}
                msg_id = res_json.get("messageId", "sent")
                logger.info(f"[EmailService] [Brevo] Successfully sent '{subject}' to {target_email} (ID: {msg_id})")
                return {"success": True, "id": msg_id, "provider": "BREVO"}
            else:
                err_body = response.text
                logger.error(f"[EmailService] [Brevo] API Error (Status {response.status_code}): {err_body}")
                last_error = f"HTTP {response.status_code}: {err_body}"
        except ImportError:
            # 2. Standard library urllib fallback
            try:
                import urllib.request
                import urllib.error
                import ssl
                data = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(BREVO_API_URL, data=data, headers=headers, method="POST")
                ctx = ssl._create_unverified_context()
                with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:
                    res_body = resp.read().decode("utf-8")
                    res_json = json.loads(res_body) if res_body else {}
                    msg_id = res_json.get("messageId", "sent")
                    logger.info(f"[EmailService] [Brevo urllib] Successfully sent '{subject}' to {target_email} (ID: {msg_id})")
                    return {"success": True, "id": msg_id, "provider": "BREVO"}
            except urllib.error.HTTPError as err:
                err_msg = err.read().decode("utf-8", errors="ignore")
                logger.error(f"[EmailService] [Brevo urllib] HTTP Error ({err.code}): {err_msg}")
                last_error = f"HTTP {err.code}: {err_msg}"
            except Exception as err:
                last_error = str(err)
                logger.warning(f"[EmailService] [Brevo urllib] Attempt {attempt} failed: {last_error}")
        except Exception as err:
            last_error = str(err)
            logger.warning(f"[EmailService] [Brevo] Attempt {attempt} failed: {last_error}")

        if attempt < max_attempts:
            import time
            time.sleep(1)

    logger.error(f"[EmailService] [Brevo] Failed delivery to {target_email} after {max_attempts} attempts: {last_error}")
    return {"success": False, "error": last_error, "provider": "BREVO"}


def _send_resend_fallback(to_email: str, subject: str, html_content: str, text_content: str = "") -> dict:
    """Fallback dispatcher using Resend API if Brevo is not configured."""
    api_key, from_email, test_email = get_resend_config()
    if not api_key:
        return {"success": False, "reason": "NO_FALLBACK_API_KEY"}

    is_sandbox = "onboarding@resend.dev" in from_email.lower()
    target_recipient = test_email if (is_sandbox and test_email) else str(to_email).strip()

    payload = {
        "from": f"ScholarAI Platform <{from_email}>",
        "to": [target_recipient],
        "subject": subject,
        "html": html_content,
    }
    if text_content:
        payload["text"] = text_content

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    try:
        import requests
        response = requests.post(RESEND_API_URL, json=payload, headers=headers, timeout=(8, 15))
        if response.status_code in (200, 201):
            return {"success": True, "id": response.json().get("id"), "provider": "RESEND"}
    except Exception as e:
        logger.error(f"[EmailService] Resend fallback failed: {e}")

    return {"success": False, "reason": "FALLBACK_FAILED"}


def _base_email_template(title: str, preheader: str, body_html: str) -> str:
    """Generate responsive, modern HTML email layout with styled cards."""
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{title}</title>
      <style>
        body {{ margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }}
        .wrapper {{ width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 16px; }}
        .card {{ background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
        .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }}
        .header p {{ margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }}
        .content {{ padding: 28px 24px; }}
        .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }}
        .badge-blue {{ background-color: #e0e7ff; color: #4338ca; }}
        .badge-green {{ background-color: #dcfce7; color: #15803d; }}
        .badge-red {{ background-color: #fee2e2; color: #b91c1c; }}
        .badge-purple {{ background-color: #ede9fe; color: #6d28d9; }}
        .info-box {{ background-color: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #f1f5f9; }}
        .info-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }}
        .info-row:last-child {{ margin-bottom: 0; }}
        .info-label {{ color: #64748b; font-weight: 500; }}
        .info-val {{ color: #0f172a; font-weight: 700; }}
        .footer {{ text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; }}
        .btn {{ display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 13px; margin-top: 16px; }}
      </style>
    </head>
    <body>
      <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
        {preheader}
      </div>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            <h1>ScholarAI Portal</h1>
            <p>Student Scholarship Management & Decision System</p>
          </div>
          <div class="content">
            {body_html}
          </div>
        </div>
        <div class="footer">
          <p>© {datetime.now().year} ScholarAI Platform. All rights reserved.</p>
          <p>You are receiving this automated email regarding your registered scholarship application.</p>
        </div>
      </div>
    </body>
    </html>
    """


def get_frontend_url() -> str:
    """Retrieve configurable Frontend Portal Base URL."""
    return os.getenv("FRONTEND_URL", "http://localhost:5173").strip().rstrip("/")


# 1. Application Submitted Notification
def send_application_submitted_email(
    student_email: str,
    student_name: str,
    scholarship_name: str,
    application_id: int,
    submitted_at: str = None
) -> dict:
    """Send confirmation email when student submits an application with tracking timeline."""
    subject = f"Scholarship Application Submitted — #{application_id}"
    preheader = f"Application #{application_id} for {scholarship_name} has been received. Track reference: SCH-TRK-{application_id:04d}."
    sub_date = submitted_at or datetime.now().strftime("%B %d, %Y at %I:%M %p")
    track_url = f"{get_frontend_url()}/dashboard/applications?id={application_id}"
    tracking_code = f"SCH-TRK-{application_id:04d}"

    body_html = f"""
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-blue">Application Submitted</span>
        <h2 style="margin: 12px 0 4px 0; color: #0f172a; font-size: 18px;">Application Successfully Received</h2>
        <p style="margin: 0; font-size: 14px; color: #475569;">Hello <strong>{student_name}</strong>, your application has been received and registered in the scholarship pipeline.</p>
      </div>

      <!-- Application Tracking Details Card -->
      <div class="info-box" style="border-left: 4px solid #4f46e5;">
        <div style="font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
          📍 Application Tracking Details
        </div>
        <div class="info-row">
          <span class="info-label">Tracking Number:</span>
          <span class="info-val" style="font-family: monospace; color: #4338ca; font-weight: 800;">{tracking_code}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Application ID:</span>
          <span class="info-val">#{application_id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Scholarship Scheme:</span>
          <span class="info-val">{scholarship_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Submission Date:</span>
          <span class="info-val">{sub_date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Status:</span>
          <span class="info-val" style="color: #4338ca; font-weight: 700;">SUBMITTED (Pending Verification)</span>
        </div>
      </div>

      <!-- Live Tracking Progress Timeline -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
          🚦 Live Progress Timeline
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 26px; vertical-align: top; padding-bottom: 12px;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #22c55e; color: #ffffff; text-align: center; line-height: 20px; font-size: 11px; font-weight: bold;">✓</div>
            </td>
            <td style="vertical-align: top; padding-bottom: 12px;">
              <strong style="font-size: 13px; color: #0f172a; display: block;">Step 1: Application Registered</strong>
              <span style="font-size: 11px; color: #64748b;">Profile and eligibility data submitted</span>
            </td>
          </tr>
          <tr>
            <td style="width: 26px; vertical-align: top; padding-bottom: 12px;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #3b82f6; color: #ffffff; text-align: center; line-height: 20px; font-size: 10px; font-weight: bold;">⏳</div>
            </td>
            <td style="vertical-align: top; padding-bottom: 12px;">
              <strong style="font-size: 13px; color: #1e40af; display: block;">Step 2: AI Document &amp; OCR Verification</strong>
              <span style="font-size: 11px; color: #64748b;">Cross-auditing certificates against profile credentials</span>
            </td>
          </tr>
          <tr>
            <td style="width: 26px; vertical-align: top; padding-bottom: 12px;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #e2e8f0; color: #94a3b8; text-align: center; line-height: 20px; font-size: 10px; font-weight: bold;">3</div>
            </td>
            <td style="vertical-align: top; padding-bottom: 12px;">
              <strong style="font-size: 13px; color: #64748b; display: block;">Step 3: Administration Committee Review</strong>
              <span style="font-size: 11px; color: #94a3b8;">Pending committee approval</span>
            </td>
          </tr>
          <tr>
            <td style="width: 26px; vertical-align: top;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #e2e8f0; color: #94a3b8; text-align: center; line-height: 20px; font-size: 10px; font-weight: bold;">4</div>
            </td>
            <td style="vertical-align: top;">
              <strong style="font-size: 13px; color: #64748b; display: block;">Step 4: Grant Disbursement</strong>
              <span style="font-size: 11px; color: #94a3b8;">Direct Benefit Transfer scheduled post-approval</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 14px; margin: 16px 0; font-size: 12px; color: #475569;">
        💡 <strong>Tracking Tip:</strong> You can monitor real-time committee review, download audit receipts, or respond to clarification requests using the tracking link below.
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="{track_url}" class="btn" style="background-color: #4f46e5;">Track Application Live Status ↗</a>
      </div>
    """
    return _send_brevo_email(student_email, subject, _base_email_template(subject, preheader, body_html), student_name=student_name)


# 2. Application Approved Notification
def send_application_approved_email(
    student_email: str,
    student_name: str,
    scholarship_name: str,
    application_id: int,
    grant_amount: str = None,
    admin_notes: str = None
) -> dict:
    """Send congratulations email with complete application tracking details when administrator approves an application."""
    subject = f"Congratulations! Scholarship Application Approved — #{application_id}"
    preheader = f"Congratulations! Your application #{application_id} for {scholarship_name} has been officially APPROVED."
    amt_text = grant_amount or "Standard Grant"
    remarks = admin_notes or "Application approved by scholarship administration committee after document verification."
    track_url = f"{get_frontend_url()}/dashboard/applications?id={application_id}"
    tracking_code = f"SCH-TRK-{application_id:04d}"
    approval_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")

    body_html = f"""
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-green">Approved &amp; Verified ✔</span>
        <h2 style="margin: 12px 0 4px 0; color: #15803d; font-size: 20px;">Congratulations {student_name}!</h2>
        <p style="margin: 0; font-size: 14px; color: #475569;">Your scholarship application has been officially <strong>APPROVED</strong> by the institutional administration committee.</p>
      </div>

      <!-- Application Tracking Details Card -->
      <div class="info-box" style="border-left: 4px solid #16a34a;">
        <div style="font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
          📍 Official Application Tracking Details
        </div>
        <div class="info-row">
          <span class="info-label">Tracking Number:</span>
          <span class="info-val" style="font-family: monospace; color: #15803d; font-weight: 800;">{tracking_code}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Application ID:</span>
          <span class="info-val">#{application_id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Scholarship Scheme:</span>
          <span class="info-val">{scholarship_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Approved Grant Amount:</span>
          <span class="info-val" style="color: #15803d; font-size: 15px; font-weight: 800;">{amt_text}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Approval Decision:</span>
          <span class="info-val" style="color: #15803d; font-weight: 800;">APPROVED &amp; VERIFIED</span>
        </div>
        <div class="info-row">
          <span class="info-label">Approval Date:</span>
          <span class="info-val">{approval_date}</span>
        </div>
      </div>

      <!-- Committee Remarks -->
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
        <strong style="font-size: 11px; color: #15803d; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Committee Verification Remarks:</strong>
        <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">{remarks}</p>
      </div>

      <!-- Live Tracking Progress Timeline -->
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px;">
          🚦 Application Lifecycle &amp; Milestone Timeline
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 26px; vertical-align: top; padding-bottom: 12px;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #22c55e; color: #ffffff; text-align: center; line-height: 20px; font-size: 11px; font-weight: bold;">✓</div>
            </td>
            <td style="vertical-align: top; padding-bottom: 12px;">
              <strong style="font-size: 13px; color: #0f172a; display: block;">Step 1: Application Submitted</strong>
              <span style="font-size: 11px; color: #64748b;">Profile criteria and application package recorded</span>
            </td>
          </tr>
          <tr>
            <td style="width: 26px; vertical-align: top; padding-bottom: 12px;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #22c55e; color: #ffffff; text-align: center; line-height: 20px; font-size: 11px; font-weight: bold;">✓</div>
            </td>
            <td style="vertical-align: top; padding-bottom: 12px;">
              <strong style="font-size: 13px; color: #0f172a; display: block;">Step 2: AI Document &amp; OCR Audit</strong>
              <span style="font-size: 11px; color: #64748b;">Certificates (Income, Community, Marksheets) verified</span>
            </td>
          </tr>
          <tr>
            <td style="width: 26px; vertical-align: top; padding-bottom: 12px;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #22c55e; color: #ffffff; text-align: center; line-height: 20px; font-size: 11px; font-weight: bold;">✓</div>
            </td>
            <td style="vertical-align: top; padding-bottom: 12px;">
              <strong style="font-size: 13px; color: #15803d; display: block;">Step 3: Committee Evaluation &amp; Approval</strong>
              <span style="font-size: 11px; color: #15803d; font-weight: 600;">Officially Cleared &amp; Approved</span>
            </td>
          </tr>
          <tr>
            <td style="width: 26px; vertical-align: top;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background-color: #3b82f6; color: #ffffff; text-align: center; line-height: 20px; font-size: 10px; font-weight: bold;">⏳</div>
            </td>
            <td style="vertical-align: top;">
              <strong style="font-size: 13px; color: #1e40af; display: block;">Step 4: Grant Disbursement &amp; Credit</strong>
              <span style="font-size: 11px; color: #64748b;">In Process — Expected within 7–10 working days directly to student account</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Next Steps Box -->
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-size: 12px; color: #475569; line-height: 1.5;">
        <strong>📌 What happens next?</strong>
        <ul style="margin: 6px 0 0 0; padding-left: 18px;">
          <li>Your tracking reference is <strong>{tracking_code}</strong>. Save this email for your records.</li>
          <li>Ensure your Aadhaar-linked bank account is active to receive the grant amount ({amt_text}) without delay.</li>
          <li>Click the button below to track live disbursement updates or download your official approval letter.</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="{track_url}" class="btn" style="background-color: #16a34a;">Track Application Live Status ↗</a>
      </div>
    """
    return _send_brevo_email(student_email, subject, _base_email_template(subject, preheader, body_html), student_name=student_name)


# 3. Application Rejected Notification
def send_application_rejected_email(
    student_email: str,
    student_name: str,
    scholarship_name: str,
    application_id: int,
    rejection_reason: str
) -> dict:
    """Send formal decision notification when administrator rejects an application with tracking reference."""
    subject = f"Scholarship Application Status Update — #{application_id}"
    preheader = f"Update regarding application #{application_id} for {scholarship_name}. Tracking reference: SCH-TRK-{application_id:04d}."
    reason_text = rejection_reason or "Does not meet specific eligibility or documentation criteria."
    track_url = f"{get_frontend_url()}/dashboard/applications?id={application_id}"
    tracking_code = f"SCH-TRK-{application_id:04d}"

    body_html = f"""
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-red">Application Declined</span>
        <h2 style="margin: 12px 0 4px 0; color: #b91c1c; font-size: 18px;">Application Status Update</h2>
        <p style="margin: 0; font-size: 14px; color: #475569;">Dear {student_name}, thank you for your application.</p>
      </div>

      <!-- Application Tracking Details Card -->
      <div class="info-box" style="border-left: 4px solid #ef4444;">
        <div style="font-size: 11px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
          📍 Application Tracking Details
        </div>
        <div class="info-row">
          <span class="info-label">Tracking Number:</span>
          <span class="info-val" style="font-family: monospace; color: #991b1b; font-weight: 800;">{tracking_code}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Application ID:</span>
          <span class="info-val">#{application_id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Scholarship Scheme:</span>
          <span class="info-val">{scholarship_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Final Decision:</span>
          <span class="info-val" style="color: #b91c1c; font-weight: 700;">Declined / Not Approved</span>
        </div>
      </div>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
        <strong style="font-size: 11px; color: #b91c1c; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Reason for Committee Decision:</strong>
        <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">{reason_text}</p>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.6;">
        You can explore other suitable scholarships matching your academic and financial criteria on your ScholarAI discovery portal.
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="{track_url}" class="btn" style="background-color: #64748b;">View Application Tracking Details ↗</a>
      </div>
    """
    return _send_brevo_email(student_email, subject, _base_email_template(subject, preheader, body_html), student_name=student_name)


# 4. Application Under Review Notification
def send_application_review_email(
    student_email: str,
    student_name: str,
    scholarship_name: str,
    application_id: int,
    admin_notes: str = None
) -> dict:
    """Send notification when administrator marks an application Under Review with tracking details."""
    subject = f"Scholarship Application Under Review — #{application_id}"
    preheader = f"Application #{application_id} for {scholarship_name} is currently under verification. Tracking ref: SCH-TRK-{application_id:04d}."
    notes = admin_notes or "Your application and certificates are currently being reviewed by the administration committee."
    track_url = f"{get_frontend_url()}/dashboard/applications?id={application_id}"
    tracking_code = f"SCH-TRK-{application_id:04d}"

    body_html = f"""
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-purple">Under Review ⏳</span>
        <h2 style="margin: 12px 0 4px 0; color: #6d28d9; font-size: 18px;">Application Under Review</h2>
        <p style="margin: 0; font-size: 14px; color: #475569;">Hello {student_name}, your scholarship application is actively being verified.</p>
      </div>

      <!-- Application Tracking Details Card -->
      <div class="info-box" style="border-left: 4px solid #7c3aed;">
        <div style="font-size: 11px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
          📍 Application Tracking Details
        </div>
        <div class="info-row">
          <span class="info-label">Tracking Number:</span>
          <span class="info-val" style="font-family: monospace; color: #6d28d9; font-weight: 800;">{tracking_code}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Application ID:</span>
          <span class="info-val">#{application_id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Scholarship Scheme:</span>
          <span class="info-val">{scholarship_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Stage:</span>
          <span class="info-val" style="color: #6d28d9; font-weight: 700;">Under Review (In Verification)</span>
        </div>
      </div>

      <div style="background-color: #faf5ff; border-left: 4px solid #a855f7; padding: 12px 16px; border-radius: 8px; margin: 16px 0;">
        <strong style="font-size: 11px; color: #6d28d9; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Review Notes:</strong>
        <p style="margin: 0; font-size: 13px; color: #581c87; line-height: 1.5;">{notes}</p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="{track_url}" class="btn" style="background-color: #7c3aed;">Track Live Application Progress ↗</a>
      </div>
    """
    return _send_brevo_email(student_email, subject, _base_email_template(subject, preheader, body_html), student_name=student_name)


# 5. Scholarship Deadline Reminder Notification
def send_deadline_reminder_email(
    student_email: str,
    student_name: str,
    scholarship_name: str,
    days_remaining: int,
    deadline_date: str
) -> dict:
    """Send deadline reminder email to eligible student before scheme closes."""
    subject = f"Deadline Reminder: {scholarship_name} closes in {days_remaining} day{'s' if days_remaining != 1 else ''}"
    preheader = f"Action required: {scholarship_name} application deadline is approaching on {deadline_date}."
    apply_url = f"{get_frontend_url()}/dashboard/recommendations"

    body_html = f"""
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-red">⏰ Deadline Approaching</span>
        <h2 style="margin: 12px 0 4px 0; color: #0f172a; font-size: 18px;">Don't Miss Your Scholarship Opportunity</h2>
        <p style="margin: 0; font-size: 14px; color: #475569;">Hello {student_name}, a scholarship scheme matching your profile closes soon.</p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Scholarship Scheme:</span>
          <span class="info-val">{scholarship_name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Application Deadline:</span>
          <span class="info-val" style="color: #b91c1c;">{deadline_date} ({days_remaining} days left)</span>
        </div>
      </div>

      <p style="font-size: 13px; color: #475569; line-height: 1.6;">
        Ensure your documents (Aadhaar, income certificate, marksheets) are verified on your profile to submit your application on time.
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="{apply_url}" class="btn">Apply Before Deadline</a>
      </div>
    """
    return _send_brevo_email(student_email, subject, _base_email_template(subject, preheader, body_html), student_name=student_name)


# 6. Automatic Scholarship Deadline Notification (7-day, 3-day, 1-day, Expired)
def send_automatic_deadline_email(
    notification_type: str,
    student_email: str,
    student_name: str,
    scholarship_name: str,
    deadline: str,
    scholarship_id: int = None
) -> dict:
    """
    Sends automatic scholarship deadline reminder or expiry notification.
    Exact templates matching ScholarAI system specification.
    Uses unified dispatcher (SMTP -> Brevo -> Resend).
    """
    name_clean = student_name or "Student"
    view_url = f"{get_frontend_url()}/dashboard/recommendations"
    if scholarship_id:
        view_url = f"{get_frontend_url()}/dashboard/recommendations?id={scholarship_id}"

    if notification_type == "DEADLINE_7_DAYS":
        subject = "ScholarAI: Scholarship Deadline in 7 Days"
        text_body = f"""Hello {name_clean},

This is a reminder that the application deadline for:

{scholarship_name}

is {deadline}.

You have 7 days remaining to complete your application.

Please log in to ScholarAI and complete your application before the deadline.

Regards,
ScholarAI Team"""

        html_body = f"""
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge badge-purple" style="background-color: #ede9fe; color: #6d28d9;">⏳ 7 Days Remaining</span>
            <h2 style="margin: 12px 0 4px 0; color: #4338ca; font-size: 18px;">Scholarship Deadline in 7 Days</h2>
            <p style="margin: 0; font-size: 14px; color: #475569;">Hello {name_clean}, this is a reminder that the application deadline for:</p>
          </div>

          <div class="info-box" style="border-left: 4px solid #6366f1;">
            <div style="font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
              📋 Scholarship Details
            </div>
            <div class="info-row">
              <span class="info-label">Scholarship Scheme:</span>
              <span class="info-val">{scholarship_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Application Deadline:</span>
              <span class="info-val" style="color: #4338ca; font-weight: 700;">{deadline}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time Remaining:</span>
              <span class="info-val" style="color: #4338ca; font-weight: 800;">7 Days Left</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            You have <strong>7 days remaining</strong> to complete your application. Please log in to ScholarAI and complete your application before the deadline.
          </p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="{view_url}" class="btn" style="background-color: #4f46e5;">View Scholarship &amp; Apply Now ↗</a>
          </div>
        """

    elif notification_type == "DEADLINE_3_DAYS":
        subject = "ScholarAI: Scholarship Deadline in 3 Days"
        text_body = f"""Hello {name_clean},

The application deadline for {scholarship_name}
is approaching.

Deadline: {deadline}

Only 3 days remain.

Please complete your application before the deadline.

Regards,
ScholarAI Team"""

        html_body = f"""
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge" style="background-color: #fef3c7; color: #d97706;">⚠️ 3 Days Remaining</span>
            <h2 style="margin: 12px 0 4px 0; color: #b45309; font-size: 18px;">Scholarship Deadline in 3 Days</h2>
            <p style="margin: 0; font-size: 14px; color: #475569;">Hello {name_clean}, the application deadline for <strong>{scholarship_name}</strong> is approaching.</p>
          </div>

          <div class="info-box" style="border-left: 4px solid #f59e0b;">
            <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
              📋 Deadline Approaching
            </div>
            <div class="info-row">
              <span class="info-label">Scholarship Scheme:</span>
              <span class="info-val">{scholarship_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Deadline:</span>
              <span class="info-val" style="color: #b45309; font-weight: 700;">{deadline}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time Remaining:</span>
              <span class="info-val" style="color: #b45309; font-weight: 800;">Only 3 Days Left</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            <strong>Only 3 days remain.</strong> Please complete your application before the deadline to ensure your consideration.
          </p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="{view_url}" class="btn" style="background-color: #d97706;">View Scholarship &amp; Submit Application ↗</a>
          </div>
        """

    elif notification_type == "DEADLINE_1_DAY":
        subject = "URGENT: Scholarship Deadline Tomorrow"
        text_body = f"""Hello {name_clean},

The application deadline for:

{scholarship_name}

is TOMORROW.

Deadline: {deadline}

Please complete your application immediately to avoid missing the deadline.

Regards,
ScholarAI Team"""

        html_body = f"""
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge badge-red" style="background-color: #fee2e2; color: #dc2626;">🚨 URGENT: Tomorrow</span>
            <h2 style="margin: 12px 0 4px 0; color: #b91c1c; font-size: 18px;">Scholarship Deadline Tomorrow!</h2>
            <p style="margin: 0; font-size: 14px; color: #475569;">Hello {name_clean}, the application deadline for <strong>{scholarship_name}</strong> is <strong>TOMORROW</strong>.</p>
          </div>

          <div class="info-box" style="border-left: 4px solid #ef4444; background-color: #fef2f2;">
            <div style="font-size: 11px; font-weight: 800; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
              ⚠️ Immediate Action Required
            </div>
            <div class="info-row">
              <span class="info-label">Scholarship Scheme:</span>
              <span class="info-val">{scholarship_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Official Deadline:</span>
              <span class="info-val" style="color: #b91c1c; font-weight: 800;">{deadline} (TOMORROW)</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Please complete your application immediately to avoid missing the deadline. Late submissions cannot be accepted.
          </p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="{view_url}" class="btn" style="background-color: #dc2626;">Complete Application Immediately ↗</a>
          </div>
        """

    elif notification_type == "EXPIRED":
        subject = "ScholarAI: Scholarship Application Deadline Passed"
        text_body = f"""Hello {name_clean},

The application deadline for:

{scholarship_name}

has passed.

Deadline: {deadline}

The scholarship has now been marked as expired in ScholarAI.

Regards,
ScholarAI Team"""

        html_body = f"""
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="badge" style="background-color: #f1f5f9; color: #64748b;">🚫 Application Closed</span>
            <h2 style="margin: 12px 0 4px 0; color: #334155; font-size: 18px;">Scholarship Application Deadline Passed</h2>
            <p style="margin: 0; font-size: 14px; color: #475569;">Hello {name_clean}, the application deadline for <strong>{scholarship_name}</strong> has passed.</p>
          </div>

          <div class="info-box" style="border-left: 4px solid #94a3b8;">
            <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
              📁 Archived Scheme Details
            </div>
            <div class="info-row">
              <span class="info-label">Scholarship Scheme:</span>
              <span class="info-val">{scholarship_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Deadline:</span>
              <span class="info-val" style="color: #64748b; font-weight: 700;">{deadline}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-val" style="color: #64748b; font-weight: 700;">EXPIRED</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            The scholarship has now been marked as expired in ScholarAI. You can explore other active scholarships that match your profile on your dashboard.
          </p>

          <div style="text-align: center; margin-top: 24px;">
            <a href="{view_url}" class="btn" style="background-color: #475569;">Explore Active Scholarships ↗</a>
          </div>
        """
    else:
        logger.warning(f"[EmailService] Unknown notification type '{notification_type}'.")
        return {"success": False, "reason": "UNKNOWN_NOTIFICATION_TYPE"}

    preheader = f"ScholarAI deadline update for {scholarship_name}: {deadline}"
    full_html = _base_email_template(subject, preheader, html_body)

    return send_unified_email(
        to_email=student_email,
        subject=subject,
        html_content=full_html,
        text_content=text_body,
        student_name=name_clean
    )

