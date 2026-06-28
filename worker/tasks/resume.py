"""
Resume generation task.

Flow:
  1. Receive task payload: { "task": "gen_resume", "user_id": 16 }
  2. Fetch full student row from Postgres.
  3. Normalise all JSONB fields into plain Python lists.
  4. Render the Jinja2 HTML template with student data.
  5. Convert HTML → PDF using WeasyPrint.
  6. Save PDF to the shared storage volume.
  7. Update students table: resume_ready = true, resume_file_name = "resume_16.pdf"
"""

import json
import logging
import os

import psycopg2
import psycopg2.extras
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML

from config import DB_CONFIG, STORAGE_PATH

log          = logging.getLogger('worker.resume')
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), '..', 'templates')


def _get_student(user_id: int) -> dict:
    """
    Fetch one student row and return it as a plain dict.
    Uses RealDictCursor so column names become dict keys automatically.
    """
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            """
            SELECT
                id, name, email, branch, cgpa, passing_year, about,
                domains, work_experience, projects, education, certificates
            FROM students
            WHERE id = %s
              AND deleted_at IS NULL
            """,
            (user_id,),
        )
        row = cur.fetchone()
        if row is None:
            raise ValueError(f'Student {user_id} not found in database')
        return dict(row)
    finally:
        conn.close()