import os
import sys
import time
import logging
from typing import Callable, Any, Dict, Tuple, Optional

def track_performance(func: Callable) -> Callable:
    """Decorator to measure and log execution time of a function.
    
    Args:
        func: Function to be decorated
        
    Returns:
        Wrapped function with performance tracking
    """
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        start_time = time.perf_counter()
        result = None
        
        try:
            result = func(*args, **kwargs)
        except Exception as e:
            logging.error(f"Error in {func.__name__}: {str(e)}")
            raise
        finally:
            elapsed_time = time.perf_counter() - start_time
            logging.info(
                f"Function '{func.__name__}' executed in "
                f"{elapsed_time:.6f} seconds"
            )
            
        return result
    return wrapper

@track_performance
def process_data(data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
    """Process and transform input data with performance tracking.
    
    Args:
        data: Dictionary containing raw input data
        
    Returns:
        Tuple containing processed data and status code
    """
    processed = {
        key.lower(): value 
        for key, value in data.items() 
        if key not in ['_meta', '__temp']
    }
    return processed, 200

if __name__ == "__main__":
    # Example usage
    sample_data = {
        "ID": 123,
        "Timestamp": "2023-09-01T12:00:00Z",
        "_meta": {"source": "internal"}
    }
    
    try:
        result, status = process_data(sample_data)
        print(f"Processed data: {result}")
        print(f"Status code: {status}")
    except Exception as e:
        print(f"Processing failed: {str(e)}")
        sys.exit(1)