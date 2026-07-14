"""
Email sending via Resend API.
All email sending in the worker goes through _send().
"""
import logging
import resend

from config import RESEND_API_KEY, EMAIL_FROM
log = logging.getLogger('worker.email')


def _send(to: str, subject: str, html_body: str) -> None:
    if not RESEND_API_KEY:
        log.warning(
            'RESEND_API_KEY not set — skipping email to %s | subject: %s',
            to, subject,
        )
        return

    resend.api_key = RESEND_API_KEY

    try:
        response = resend.Emails.send({
            'from':    EMAIL_FROM,
            'to':      [to],
            'subject': subject,
            'html':    html_body,
        })
        log.info('Email sent via Resend → %s | id: %s', to, response.get('id'))
    except Exception as exc:
        log.error('Resend error sending to %s: %s', to, exc)
        raise


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
