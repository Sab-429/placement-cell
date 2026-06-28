"""
Worker entry point.

Connects to Redis and blocks on the task queue.
When a task arrives it is dispatched to the matching handler function.
Errors never crash the loop — they are logged and the next task runs.

Task queue is a Redis LIST.
Go API pushes to the LEFT  (LPush).
Worker pops  from the RIGHT (BRPop) → FIFO order.
"""

import logging
import time
import redis
from config import QUEUE_KEY, REDIS_URL


logging.basicConfig(
    level= logging.INFO,
    format= '%(asctime)s [%(levelname)s] %(name)s — %(message)s',
    datefmt = '%Y-%m-%d %H:%M:%S',
)

log = logging.getLogger('worker')

TASK_ROUTER = {
    'gen_resume': generate_resume,
    'send_email': send_status_email,
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
        
