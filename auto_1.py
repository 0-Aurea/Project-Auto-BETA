import os
import sys
import time
from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys in each entry to lowercase for consistent data handling.
    
    Args:
        data: List of dictionaries containing raw data entries. Each entry
              should have an 'id' field to be included in the output.
    
    Returns:
        List of processed dictionaries with lowercase keys and only entries
        that contained an 'id' field.
    """
    processed = []
    for item in data:
        if 'id' not in item:
            continue
        processed_item = {key.lower(): value for key, value in item.items()}
        processed.append(processed_item)
    return processed