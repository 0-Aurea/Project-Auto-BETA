import os
import sys
import time
from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Validates that input is a list of dictionaries.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with filtered and transformed keys
        
    Raises:
        ValueError: If input data is not a list of dictionaries
    """
    if not isinstance(data, list):
        raise ValueError("Input data must be a list of dictionaries.")
        
    processed = []
    for entry in data:
        if not isinstance(entry, dict):
            raise ValueError("Each item in data must be a dictionary.")
        if 'id' not in entry:
            continue
        # Convert keys to lowercase
        lowercased = {key.lower(): value for key, value in entry.items()}
        processed.append(lowercased)
    return processed