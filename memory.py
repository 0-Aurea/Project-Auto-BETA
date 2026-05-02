import os
import sys
import time
from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Removes entries with invalid data types.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with normalized keys and valid entries
    """
    if not isinstance(data, list):
        raise ValueError("Input data must be a list of dictionaries")
        
    processed = []
    for item in data:
        if not isinstance(item, dict) or 'id' not in item:
            continue
            
        normalized = {key.lower(): value for key, value in item.items()}
        processed.append(normalized)
        
    return processed