"""
Worker entry point.

Connects to Redis and blocks on the task queue.
When a task arrives it is dispatched to the matching handler function.
Errors never crash the loop — they are logged and the next task runs.

Task queue is a Redis LIST.
Go API pushes to the LEFT  (LPush).
Worker pops  from the RIGHT (BRPop) → FIFO order.
"""

