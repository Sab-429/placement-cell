"""
Worker entry point.

Connects to Redis and blocks on the task queue.
When a task arrives it is dispatched to the matching handler function.
Errors never crash the loop — they are logged and the next task runs.

Task queue is a Redis LIST.
Go API pushes to the LEFT  (LPush).
Worker pops  from the RIGHT (BRPop) → FIFO order.
"""

import os
os.environ['G_MESSAGES_DEBUG'] = ''
os.environ['GLIB_SILENCE_DEPRECATION_WARNINGS'] = '1'


import json
import logging
import time
import redis
from config import QUEUE_KEY, REDIS_URL, STOARGE_PATH


from tasks.resume import generate_resume
from tasks.email  import send_status_email


from tasks.notification  import (
    notify_recruiter_new_application,
    notify_student_status_change,
    notify_student_resume_ready,
)
logging.basicConfig(
    level= logging.INFO,
    format= '%(asctime)s [%(levelname)s] %(name)s — %(message)s',
    datefmt = '%Y-%m-%d %H:%M:%S',
)


log = logging.getLogger('worker')

TASK_ROUTER = {
    'gen_resume': generate_resume,
    'send_email': send_status_email,
    'notify_recruiter_new_application': notify_recruiter_new_application,
    'notify_student_status_change':    notify_student_status_change,
    'notify_student_resume_ready':     notify_student_resume_ready,
}



def connect_redis(retries: int= 5,  delay: int = 3):
    """Connect to Redis with retry — useful when worker starts before Redis."""
    for attempt in range(1, retries + 1):
        try:
            r = redis.from_url(REDIS_URL, decode_responses=True)
            r.ping()
            log.info('Connected to Redis at %s', REDIS_URL)
            return r

        except redis.ConnectionError:
            log.warning(
                'Redis not ready, retrying in %ds (attempt %d/%d)',
                delay, attempt, retries,
            )
            time.sleep(delay)

    log.error('Could not connect to Redis after %d attempts — exiting', retries)
    return None

def main():
    r = connect_redis()
    if r is None:
        return
    log.info("Listing on queue '%s'",QUEUE_KEY)

    while True:
        try:
            result = r.brpop(QUEUE_KEY, timeout=5)
            if result is None:
                continue

            _, raw = result

            try:
                task = json.loads(raw)
            except json.JSONDecoder:
                log.error('Could not parse task JSON: %r', raw)
                continue
            task_name = task.get('task')
            handler = TASK_ROUTER.get(task_name)

            if handler is None:
                log.warning('Unknown task type: %r', task_name)
                continue
            
            log.info('→ Starting task: %s | payload: %s', task_name, task)
            handler(task)
            log.info('Finished task: %s', task_name)

        except KeyboardInterrupt:
            log.info('Shutdown signal received — worker stopping')
            break

        except Exception as exc:
            log.error('Unexpected error: %s', exc, exc_info=True)
            time.sleep(1)

if __name__ == '__main__':
    main()
