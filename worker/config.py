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
    'host':     os.getenv('DB_HOST',     'localhost'),
    'port':     int(os.getenv('DB_PORT', '5432')),
    'user':     os.getenv('DB_USER',     'portal'),
    'password': os.getenv('DB_PASSWORD', 'portalpass'),
    'dbname':   os.getenv('DB_NAME',     'placement'),
}

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
QUEUE_KEY = 'tasks:worker'

STORAGE_PATH = os.getenv('STORAGE_PATH', './storage')

# ── Resend ─────────────────────────────────────────────────────────────
RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
EMAIL_FROM     = os.getenv('EMAIL_FROM', 'Auth <auth@sabyasachisaha.in>')
APP_URL        = os.getenv('APP_URL', 'http://localhost:5173')