# Standard library imports
import os
import sys
import time
from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Removes entries with invalid or missing
    data to ensure dataset quality.
    
    Args:
        data: List of dictionaries containing raw data entries. Each entry
              should have at least an 'id' field.
    
    Returns:
        List of processed dictionaries with lowercase keys and validated data.
    
    Raises:
        ValueError: If input data is empty or not a list of dictionaries.
    """
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise ValueError("Input data must be a list of dictionaries.")
    
    if not data:
        raise ValueError("Input data cannot be empty.")
    
    processed = []
    for entry in data:
        if 'id' not in entry:
            continue
        processed_entry = {key.lower(): value for key, value in entry.items()}
        processed.append(processed_entry)
    
    return processed