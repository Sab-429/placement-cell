"""
Single place for all environment variable reads.
Every other file imports from here instead of calling os.getenv directly.
This means if an env var name changes, you only update it in one place.
"""

import os
from dotenv import load_dotenv

load_dotenv(
    dotenv_path=os.path.join(os.path.dirname(__file__), '..' , '.env.global'),
    override=False,
)

#Database

DB_CONFIG = {
    'host':     os.getenv('DB_HOST'),
    'port':     int(os.getenv('DB_PORT')),
    'user':     os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'dbname':   os.getenv('DB_NAME'),
    'sslmode':  os.getenv('DB_SSLMODE'),
}

REDIS_URL = os.getenv('REDIS_URL')
QUEUE_KEY = 'tasks:worker'

STORAGE_PATH = os.getenv('STORAGE_PATH')

# ── Resend ─────────────────────────────────────────────────────────────
RESEND_API_KEY = os.getenv('RESEND_API_KEY')
EMAIL_FROM     = os.getenv('EMAIL_FROM')
APP_URL        = os.getenv('APP_URL')