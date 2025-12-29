import concurrent.futures
import threading
import traceback
import uuid
from typing import Dict

# Simple thread pool and task registry
import os

# Allow more background workers based on CPU, but keep a small cap to avoid overloading
_DEFAULT_WORKERS = min(4, max(1, (os.cpu_count() or 1)))
_executor = concurrent.futures.ThreadPoolExecutor(max_workers=_DEFAULT_WORKERS)
_TASKS: Dict[str, concurrent.futures.Future] = {}

def submit_task(fn, *args, **kwargs):
    """Submit a call to run in background. Returns a task_id."""
    def _wrap():
        try:
            return fn(*args, **kwargs)
        except Exception:
            traceback.print_exc()
            raise

    future = _executor.submit(_wrap)
    task_id = str(uuid.uuid4())
    _TASKS[task_id] = future
    return task_id

def get_task_status(task_id: str):
    future = _TASKS.get(task_id)
    if not future:
        return {"status": "not_found"}
    if future.running():
        return {"status": "running"}
    if future.done():
        exc = future.exception()
        if exc:
            return {"status": "failed", "error": str(exc)}
        return {"status": "done", "result": future.result()}
    return {"status": "pending"}

def list_tasks():
    return {tid: get_task_status(tid) for tid in list(_TASKS.keys())}

def shutdown(wait: bool = False):
    _executor.shutdown(wait=wait)
