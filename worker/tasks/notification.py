"""
All notification emails for the placement portal.

  1. notify_recruiter_new_application — when student applies
  2. notify_student_status_change     — when recruiter updates status
  3. notify_student_resume_ready      — when PDF generation finishes
"""

import logging
from config import APP_URL
from tasks.email import _send

log = logging.getLogger('worker.notification')

_BASE_STYLE = """
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8fafc;
  margin: 0;
  padding: 0;
"""
_CARD_STYLE = """
  max-width: 560px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
"""

def _header(emoji: str, title: str, subtitle: str = '') -> str:
    return f"""
    <div style="background:#0f172a;padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">{emoji}</div>
      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">{title}</h1>
      {f'<p style="color:#94a3b8;font-size:14px;margin:8px 0 0;">{subtitle}</p>' if subtitle else ''}
    </div>
    """

def _footer() -> str:
    return f"""
    <div style="background:#f8fafc;padding:20px 32px;text-align:center;
                border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        PlacementPortal · This is an automated notification · Do not reply
      </p>
    </div>
    """

def _button(text: str, url: str, color: str = '#0f172a') -> str:
    return f"""
    <div style="text-align:center;margin:24px 0;">
      <a href="{url}"
         style="display:inline-block;background:{color};color:#ffffff;
                padding:14px 32px;border-radius:10px;text-decoration:none;
                font-size:15px;font-weight:600;letter-spacing:-0.2px;">
        {text}
      </a>
    </div>
    """
def notify_recruiter_new_application(task: dict) -> None:
    """
    Called when a student applies to a listing.
    task = {
        "task": "notify_recruiter_new_application",
        "recruiter_email": "hr@company.com",
        "recruiter_name": "Tech Corp",
        "student_name": "Rahul Kumar",
        "student_email": "rahul@college.edu",
        "student_branch": "CSE",
        "student_cgpa": 8.5,
        "listing_title": "Backend Developer"
    }
    """

    recruiter_email = task['recruiter_email']
    recruiter_name  = task.get('recruiter_name', 'Recruiter')
    student_name    = task['student_name']
    student_email   = task.get('student_email', '')
    student_branch  = task.get('student_branch', '—')
    student_cgpa    = task.get('student_cgpa', '—')
    listing_title   = task['listing_title']

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
    <body style="{_BASE_STYLE}">
      <div style="{_CARD_STYLE}">

        {_header('📋', 'New Application Received', listing_title)}

        <div style="padding:32px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Hi <strong>{recruiter_name}</strong>,<br><br>
            <strong>{student_name}</strong> has applied for your listing.
            Here are their details:
          </p>

          <!-- Applicant card -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;
                      padding:20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#64748b;font-size:13px;width:35%;">
                  Full Name
                </td>
                <td style="padding:8px 0;color:#0f172a;font-weight:600;font-size:13px;">
                  {student_name}
                </td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="padding:8px 0;color:#64748b;font-size:13px;">Email</td>
                <td style="padding:8px 0;color:#0f172a;font-size:13px;">{student_email}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="padding:8px 0;color:#64748b;font-size:13px;">Branch</td>
                <td style="padding:8px 0;color:#0f172a;font-size:13px;">{student_branch}</td>
              </tr>
              <tr style="border-top:1px solid #e2e8f0;">
                <td style="padding:8px 0;color:#64748b;font-size:13px;">CGPA</td>
                <td style="padding:8px 0;color:#0f172a;font-size:13px;">{student_cgpa}</td>
              </tr>
            </table>
          </div>

          {_button('View Applicants →', f'{APP_URL}/recruiter/listings')}
        </div>

        {_footer()}
      </div>
    </body>
    </html>
    """

    _send(
        to        = recruiter_email,
        subject   = f'📋 New application: {student_name} → {listing_title}',
        html_body = html,
    )
    log.info('Recruiter %s notified about new application from %s', recruiter_email, student_name)

    _send(
        to        = recruiter_email,
        subject   = f'New application: {student_name} applied for {listing_title}',
        html_body = html,
    )
    log.info(
        'Recruiter notified: %s about %s',recruiter_email, student_name,
    )


def notify_student_status_change(task: dict) -> None:
    """
    Called when a recruiter updates an application status.
    task = {
        "task": "notify_student_status_change",
        "student_email": "rahul@college.edu",
        "student_name": "Rahul Kumar",
        "company_name": "Tech Corp",
        "listing_title": "Backend Developer",
        "status": "shortlisted"
    }
    """
    
    student_email = task['student_email']
    student_name  = task['student_name']
    company_name  = task['company_name']
    listing_title = task['listing_title']
    status        = task['status']
    

    STATUS_MAP = {
        'shortlisted': {
            'emoji':   '🎉',
            'label':   'Shortlisted',
            'color':   '#2563eb',
            'bg':      '#eff6ff',
            'border':  '#bfdbfe',
            'subject': f' You have been shortlisted for {listing_title}',
            'heading': 'Congratulations! You\'ve been shortlisted.',
            'message': (
                f'Great news! Your application for <strong>{listing_title}</strong> at '
                f'<strong>{company_name}</strong> has been reviewed and you have been '
                f'<strong>shortlisted</strong> for the next round. '
                f'Expect to hear from the recruiter soon with further details about the process.'
            ),
            'tip': ' Tip: Prepare for the next round by reviewing the job description and your resume.',
        },
        'selected': {
            'emoji':   '🏆',
            'label':   'Selected',
            'color':   '#16a34a',
            'bg':      '#f0fdf4',
            'border':  '#bbf7d0',
            'subject': f' You have been selected for {listing_title} at {company_name}!',
            'heading': 'Congratulations! You\'ve been selected!',
            'message': (
                f'Excellent news! You have been <strong>selected</strong> for the role of '
                f'<strong>{listing_title}</strong> at <strong>{company_name}</strong>. '
                f'The recruiter will reach out to you shortly with the offer letter and '
                f'details about the onboarding process.'
            ),
            'tip': ' Well done! Make sure to check your email for the offer letter.',
        },
        'rejected': {
            'emoji':   '📝',
            'label':   'Not Selected',
            'color':   '#dc2626',
            'bg':      '#fef2f2',
            'border':  '#fecaca',
            'subject': f'Update on your application for {listing_title}',
            'heading': 'Application Status Update',
            'message': (
                f'Thank you for applying for <strong>{listing_title}</strong> at '
                f'<strong>{company_name}</strong>. After careful consideration, '
                f'we regret to inform you that you have not been selected for this role at this time. '
                f'We encourage you to keep applying — the right opportunity is just around the corner!'
            ),
            'tip': ' Don\'t give up! Browse more listings and keep applying.',
        },
    }

    cfg = STATUS_MAP.get(status, {
        'emoji':   '📬',
        'label':   status.capitalize(),
        'color':   '#6b7280',
        'bg':      '#f9fafb',
        'border':  '#e5e7eb',
        'subject': f'Application update: {listing_title}',
        'heading': 'Application Status Updated',
        'message': f'Your application status for <strong>{listing_title}</strong> has been updated to <strong>{status}</strong>.',
        'tip':     '',
    })

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
    <body style="{_BASE_STYLE}">
      <div style="{_CARD_STYLE}">

        {_header(cfg['emoji'], cfg['heading'])}

        <div style="padding:32px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi <strong>{student_name}</strong>,
          </p>

          <!-- Status badge -->
          <div style="background:{cfg['bg']};border:1px solid {cfg['border']};
                      border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="color:#64748b;font-size:11px;text-transform:uppercase;
                      letter-spacing:0.1em;margin:0 0 8px;">Application Status</p>
            <p style="color:{cfg['color']};font-size:26px;font-weight:800;margin:0;">
              {cfg['label']}
            </p>
            <p style="color:#64748b;font-size:13px;margin:8px 0 0;">
              {listing_title} · {company_name}
            </p>
          </div>

          <!-- Message -->
          <p style="color:#334155;font-size:14px;line-height:1.7;
                    background:#f8fafc;border-radius:10px;padding:16px;margin:0 0 16px;">
            {cfg['message']}
          </p>

          <!-- Tip -->
          {f'<p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 24px;">{cfg["tip"]}</p>' if cfg.get('tip') else ''}

          {_button('View My Applications →', f'{APP_URL}/student/dashboard')}
        </div>

        {_footer()}
      </div>
    </body>
    </html>
    """
    _send(
        to        = student_email,
        subject   = cfg['subject'],
        html_body = html,
    )
    log.info('Student %s notified — status: %s for %s', student_email, status, listing_title)

def notify_student_resume_ready(task: dict) -> None:
    """
    Called when resume generation is complete.
    task = {
        "task": "notify_student_resume_ready",
        "student_email": "rahul@college.edu",
        "student_name": "Rahul Kumar"
    }
    """
    student_email = task['student_email']
    student_name = task['student_name']


    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"></head>
    <body style="{_BASE_STYLE}">
      <div style="{_CARD_STYLE}">

        {_header('📄', 'Your Resume is Ready!', 'Download and start applying')}

        <div style="padding:32px;">
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Hi <strong>{student_name}</strong>,
          </p>
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your resume has been generated successfully from your profile data.
            You can download it directly from your profile page and start applying
            to jobs right away!
          </p>

          <!-- Feature list -->
          <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="color:#0f172a;font-size:13px;font-weight:600;margin:0 0 12px;">
              Your resume includes:
            </p>
            {"".join([
              f'<div style="display:flex;align-items:center;gap:10px;padding:6px 0;">'
              f'<span style="color:#16a34a;font-size:16px;">✓</span>'
              f'<span style="color:#475569;font-size:13px;">{item}</span>'
              f'</div>'
              for item in [
                'Academic information & CGPA',
                'Skills & domains',
                'Work experience',
                'Projects',
                'Education & certifications',
              ]
            ])}
          </div>

          {_button('Download Resume →', f'{APP_URL}/student/profile', '#16a34a')}

          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
            You can regenerate your resume anytime from your profile page
            after updating your information.
          </p>
        </div>

        {_footer()}
      </div>
    </body>
    </html>
    """

    _send(
        to = student_email,
        subject='Your PlacementPortal resume is ready to download',
        html_body=html
    )
    log.info('Student %s notified — resume ready', student_email)