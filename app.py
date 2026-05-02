import os
import sys
import time
from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with filtered and transformed keys
        
    Raises:
        ValueError: If input data is not a list of dictionaries
    """
    try:
        if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
            raise ValueError("Input data must be a list of dictionaries")
            
        return [
            {key.lower(): value for key, value in item.items() if value is not None}
            for item in data
        ]
    except Exception as e:
        print(f"Error processing data: {str(e)}", file=sys.stderr)
        raise