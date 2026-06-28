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