"""
Email sending task.

Two ways to use this:
  1. Via Redis queue:
       task = { "task": "send_email", "to": "...", "subject": "...", "body": "<html>" }

  2. Directly from other task handlers:
       from tasks.email import send_application_status
       send_application_status(student_email, student_name, company, title, status)
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText

from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM

log = logging.getLogger('worker.email')


# ── Core send ──────────────────────────────────────────────────────────

def _send(to: str, subject: str, html_body: str) -> None:
    """
    Send one HTML email via SMTP with STARTTLS.
    Compatible with SendGrid, Mailgun, Gmail SMTP.

    If SMTP credentials are not configured, logs a warning and skips
    so the worker doesn't crash in development.
    """
    if not SMTP_USER or not SMTP_PASS:
        log.warning(
            'SMTP not configured — skipping email to %s | subject: %s',
            to, subject,
        )
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From']    = EMAIL_FROM
    msg['To']      = to
    msg.attach(MIMEText(html_body, 'html'))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, [to], msg.as_string())
        log.info('Email sent → %s | subject: %s', to, subject)
    except smtplib.SMTPException as exc:
        log.error('SMTP error sending to %s: %s', to, exc)
        raise


# ── Queue handler ──────────────────────────────────────────────────────

def send_status_email(task: dict) -> None:
    """
    Generic email handler — called by the worker router.

    Expected task payload:
    {
        "task":    "send_email",
        "to":      "student@college.edu",
        "subject": "Your application was updated",
        "body":    "<html>...</html>"
    }
    """
    _send(
        to        = task['to'],
        subject   = task['subject'],
        html_body = task['body'],
    )


# ── Typed helper ───────────────────────────────────────────────────────

def send_application_status(
    student_email: str,
    student_name:  str,
    company_name:  str,
    listing_title: str,
    status:        str,
) -> None:
    """
    Sends a formatted application status change email.
    Called directly from other tasks — not via the Redis queue.

    Usage:
        send_application_status(
            "rahul@college.edu", "Rahul",
            "Tech Corp", "Backend Developer",
            "shortlisted"
        )
    """
    status_text = {
        'shortlisted': '🎉 Great news! You have been shortlisted for the next round.',
        'selected':    '🏆 Congratulations! You have been selected for this role.',
        'rejected':    'Thank you for applying. Unfortunately you were not selected this time. Keep going!',
    }.get(status, f'Your application status has changed to: {status}')

    status_color = {
        'shortlisted': '#2563EB',
        'selected':    '#16A34A',
        'rejected':    '#DC2626',
    }.get(status, '#6B7280')

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="
        font-family: system-ui, -apple-system, sans-serif;
        background: #f9fafb;
        margin: 0;
        padding: 40px 16px;
    ">
      <div style="
          max-width: 520px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      ">
        <!-- Header -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 22px; font-weight: 700; color: #0f172a;">
            Application Update
          </div>
          <div style="font-size: 13px; color: #64748b; margin-top: 2px;">
            PlacementPortal
          </div>
        </div>

        <!-- Greeting -->
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Hi <strong>{student_name}</strong>,
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Your application for <strong>{listing_title}</strong>
          at <strong>{company_name}</strong> has been updated.
        </p>

        <!-- Status box -->
        <div style="
            background: #f8fafc;
            border-left: 4px solid {status_color};
            border-radius: 8px;
            padding: 16px 20px;
            margin: 24px 0;
        ">
          <div style="
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #94a3b8;
              margin-bottom: 6px;
          ">
            Application Status
          </div>
          <div style="
              font-size: 20px;
              font-weight: 700;
              color: {status_color};
              text-transform: capitalize;
          ">
            {status}
          </div>
        </div>

        <!-- Message -->
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          {status_text}
        </p>

        <!-- Footer -->
        <div style="
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #94a3b8;
            text-align: center;
        ">
          This message was sent by PlacementPortal · Do not reply to this email
        </div>
      </div>
    </body>
    </html>
    """

    _send(
        to        = student_email,
        subject   = f'Update on your application: {listing_title} at {company_name}',
        html_body = html_body,
    )