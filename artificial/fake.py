import os
import sys
import time
from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistent processing.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with lowercase keys and valid 'id' fields
    """
    if not data:
        return []
    
    return [
        {key.lower(): value for key, value in item.items()}
        for item in data
        if 'id' in item
    ]