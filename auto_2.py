import os
import sys
import time
from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field. Transforms all dictionary
    keys to lowercase for consistency. Removes entries with invalid or missing
    data to ensure dataset quality.
    
    Args:
        data: List of dictionaries containing raw data entries.
        
    Returns:
        List of processed dictionaries with lowercase keys and valid 'id' fields.
    """
    return [
        {key.lower(): value for key, value in item.items()}
        for item in data
        if 'id' in item
    ]