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
              must have an 'id' field to be included in the output.
    
    Returns:
        List of processed dictionaries with lowercase keys and only entries
        containing an 'id' field.
    """
    return [
        {key.lower(): value for key, value in entry.items()}
        for entry in data
        if 'id' in entry
    ]