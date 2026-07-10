"""
Notification task handler.
Sends emails for:
  - New application received (to recruiter)
  - Application status changed (to student)
  - Resume generated (to student)
"""

import logging


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

