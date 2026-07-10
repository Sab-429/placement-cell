"""
Notification task handler.
Sends emails for:
  - New application received (to recruiter)
  - Application status changed (to student)
  - Resume generated (to student)
"""

import logging
from tasks.email import _send

log = logging.getLogger('worker.notification')

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
    student_name    = task['student_name']
    listing_title   = task['listing_title']
    student_branch  = task.get('student_branch', '')
    student_cgpa    = task.get('student_cgpa', 0)
    student_email   = task.get('student_email', '')


    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;
                  padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
          <div style="width:40px;height:40px;background:#0f172a;border-radius:10px;
                      display:flex;align-items:center;justify-content:center;">
            <span style="color:white;font-size:18px;">📋</span>
          </div>
          <div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;">New Application</div>
            <div style="font-size:13px;color:#64748b;">PlacementPortal</div>
          </div>
        </div>

        <p style="color:#334155;font-size:15px;line-height:1.6;">
          You have received a new application for <strong>{listing_title}</strong>.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;
                    padding:20px;margin:20px 0;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;
                      color:#94a3b8;margin-bottom:12px;">Applicant Details</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;width:40%;">Name</td>
              <td style="padding:6px 0;color:#0f172a;font-weight:600;font-size:13px;">
                {student_name}
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Email</td>
              <td style="padding:6px 0;color:#0f172a;font-size:13px;">{student_email}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Branch</td>
              <td style="padding:6px 0;color:#0f172a;font-size:13px;">{student_branch}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">CGPA</td>
              <td style="padding:6px 0;color:#0f172a;font-size:13px;">{student_cgpa}</td>
            </tr>
          </table>
        </div>

        <a href="http://localhost:5173/recruiter/listings"
           style="display:inline-block;background:#0f172a;color:white;padding:12px 24px;
                  border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;
                  margin-top:8px;">
          View Applicants →
        </a>

        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;
                    font-size:12px;color:#94a3b8;text-align:center;">
          PlacementPortal · This is an automated notification
        </div>
      </div>
    </body>
    </html>
    """

    _send(
        to        = recruiter_email,
        subject   = f'New application: {student_name} applied for {listing_title}',
        html_body = html,
    )

    log.info(
        'Recruiter notified: %s about %s',
        recruiter_email, student_name,
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
    
    student_email = task['student_email'],
    student_name  = task['student_name'],
    company_name  = task['company_name'],
    listing_title = task['listing_title'],
    status        = task['status'],
    

    status_config = {
        'shortlisted' : {
            'color':   '#2563EB',
            'bg':      '#eff6ff',
            'border':  '#bfdbfe',
            'message': 'Congratulations! You have been shortlisted for the next round. Expect to hear from the recruiter soon with further details.',
            'label':   'Shortlisted',
        },
        'selected' : {
            'color':   '#16a34a',
            'bg':      '#f0fdf4',
            'border':  '#bbf7d0',
            'message': 'Congratulations! You have been selected for this role. The recruiter will contact you with the offer details and next steps.',
            'label':   'Selected',
        },
        'rejected' : {
            'color':   '#dc2626',
            'bg':      '#fef2f2',
            'border':  '#fecaca',
            'message': 'Thank you for applying. Unfortunately, you were not selected for this role at this time. Keep applying — the right opportunity is out there!',
            'label':   'Not Selected',
        },
    }


    cfg = status_config.get(status, {
        'color':   '#6b7280',
        'bg':      '#f9fafb',
        'border':  '#e5e7eb',
        'message': f'Your application status has been updated to: {status}',
        'label':   status.capitalize(),
    })

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;
                  padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="text-align:center;margin-bottom:28px;">
          <div style="font-size:48px;margin-bottom:12px;">{cfg['emoji']}</div>
          <div style="font-size:22px;font-weight:700;color:#0f172a;">Application Update</div>
          <div style="font-size:13px;color:#64748b;margin-top:4px;">PlacementPortal</div>
        </div>

        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Hi <strong>{student_name}</strong>,
        </p>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Your application for <strong>{listing_title}</strong> at
          <strong>{company_name}</strong> has been reviewed.
        </p>

        <!-- Status box -->
        <div style="background:{cfg['bg']};border:1px solid {cfg['border']};
                    border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;
                      color:#94a3b8;margin-bottom:8px;">Your Status</div>
          <div style="font-size:28px;font-weight:800;color:{cfg['color']};">
            {cfg['label']}
          </div>
        </div>

        <p style="color:#334155;font-size:14px;line-height:1.7;
                  background:#f8fafc;border-radius:8px;padding:16px;">
          {cfg['message']}
        </p>

        <a href="http://localhost:5173/student/dashboard"
           style="display:block;text-align:center;background:#0f172a;color:white;
                  padding:14px 24px;border-radius:8px;text-decoration:none;
                  font-size:14px;font-weight:600;margin-top:24px;">
          View My Applications →
        </a>

        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;
                    font-size:12px;color:#94a3b8;text-align:center;">
          PlacementPortal · Do not reply to this email
        </div>
      </div>
    </body>
    </html>
    """

    _send(
        to = student_email,
        subject=f'Application update: {listing_title} at {company_name}',
        html_body=html,
    )

    log.info('Student notified: %s — status: %s', student_email, status)

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
    <head><meta charset="UTF-8"></head>
    <body style="font-family:system-ui,sans-serif;background:#f9fafb;margin:0;padding:40px 16px;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;
                  padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-size:48px;">📄</div>
          <div style="font-size:22px;font-weight:700;color:#0f172a;margin-top:12px;">
            Your Resume is Ready!
          </div>
        </div>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Hi <strong>{student_name}</strong>, your resume has been generated successfully.
          You can download it from your profile page.
        </p>
        <a href="http://localhost:5173/student/profile"
           style="display:block;text-align:center;background:#0f172a;color:white;
                  padding:14px 24px;border-radius:8px;text-decoration:none;
                  font-size:14px;font-weight:600;margin-top:24px;">
          Download Resume →
        </a>
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;
                    font-size:12px;color:#94a3b8;text-align:center;">
          PlacementPortal
        </div>
      </div>
    </body>
    </html>
    """

    _send(
        to = student_email,
        subject='Your PlacementPortal resume is ready to download',
        html_body=html
    )