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

    
def _mark_ready(user_id: int, filename: str) -> None:
    """
    Set resume_ready = true and store the filename so the
    Go API can serve the download link immediately.
    """
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            UPDATE students
               SET resume_ready      = true,
                   resume_file_name  = %s,
                   updated_at        = NOW()
             WHERE id = %s
            """,
            (filename, user_id),
        )
        conn.commit()
        log.info('Marked student %d resume as ready (%s)', user_id, filename)
    finally:
        conn.close()


def _to_list(value) -> list:

    """
    Postgres JSONB columns come back as Python dicts, lists, strings,
    or even plain numbers if the data was corrupted (as we saw with domains).

    This function always returns a safe list for the Jinja2 template,
    so a corrupt value never crashes the resume generation.

    Examples:
      ["React", "Go"]   → ["React", "Go"]    (already a list)
      {"0": "React"}    → ["React"]           (dict values)
      "React"           → ["React"]           (bare string)
      23456             → []                  (number — corrupted, skip)
      None              → []                  (NULL column)
      '["React","Go"]'  → ["React", "Go"]    (JSON string — parse it)
    """
    if value is None:
        return []

    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (json.JSONDecodeError, ValueError):
            return [value] if value.strip() else []

    if isinstance(value, list):
        return [str(item) for item in value if item is not None]

    if isinstance(value, dict):
        return [str(v) for v in value.values() if v is not None]

    log.warning('Unexpected JSONB value type %s: %r — skipping', type(value).__name__, value)
    return []


def _to_item_list(value) -> list:
    """
    For structured JSONB fields like work_experience, projects, education,
    certificates — each item should be a dict with title, description, time etc.

    Returns a list of dicts safe to iterate in the template.
    """
    if value is None:
        return []

    if isinstance(value, str):
        try:
            value = json.loads(value)
        except (json.JSONDecodeError, ValueError):
            return []

    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]

    if isinstance(value, dict):
        return [v for v in value.values() if isinstance(v, dict)]

    return []


def generate_resume(task: dict) -> None:
    """
    Entry point called by the worker main loop.
    task = { "task": "gen_resume", "user_id": 16 }
    """
    user_id = int(task['user_id'])
    log.info('Generating resume for student %d', user_id)

    student = _get_student(user_id)

    student['domains']         = _to_list(student.get('domains'))
    student['work_experience'] = _to_item_list(student.get('work_experience'))
    student['projects']        = _to_item_list(student.get('projects'))
    student['education']       = _to_item_list(student.get('education'))
    student['certificates']    = _to_item_list(student.get('certificates'))

    log.debug('Student data normalised: %s', student)

    env      = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
    template = env.get_template('resume.html')
    html_str = template.render(**student)

    out_dir  = os.path.join(STORAGE_PATH, 'resumes')
    os.makedirs(out_dir, exist_ok=True)

    filename = f'resume_{user_id}.pdf'
    out_path = os.path.join(out_dir, filename)

    HTML(string=html_str).write_pdf(out_path)
    log.info('PDF written to %s', out_path)

    _mark_ready(user_id, filename)

    try:
        from tasks.notification import notify_student_resume_ready
        notify_student_resume_ready({
            'task':          'notify_student_resume_ready',
            'student_email': student['email'],
            'student_name':  student['name'],
        })
    except Exception as e:
        log.warning('Could not send resume ready email: %s', e)