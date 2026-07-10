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

    


