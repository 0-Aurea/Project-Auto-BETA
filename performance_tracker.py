import os
import sys
import time
import logging
from typing import Callable, Any, Dict, Tuple, Optional
import functools

def track_performance(func: Callable) -> Callable:
    """Decorator to measure and log execution time of a function.
    
    Args:
        func: Function to be decorated
        
    Returns:
        Wrapped function with performance tracking
    """
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        start_time = time.perf_counter()
        result = func(*args, **kwargs)
        end_time = time.perf_counter()
        elapsed = end_time - start_time
        logging.info(f"Function '{func.__name__}' executed in {elapsed:.6f} seconds")
        return result
    return wrapper