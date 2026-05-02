import os
import sys
import time
from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[Str, Any]]:
    """
    Process raw data by filtering entries with valid 'id' and converting keys to lowercase.
    
    Filters out entries that do not contain an 'id' key or where the 'id' is not a string.
    Transforms all keys in the remaining entries to lowercase for consistency.
    
    Args:
        data: A list of dictionaries representing raw data entries. Each entry must
              have an 'id' key with a string value to be included in the output.
    
    Returns:
        A list of processed dictionaries with all keys in lowercase and only entries
        that passed the 'id' validation.
    """
    return [
        {key.lower(): value for key, value in entry.items()}
        for entry in data
        if isinstance(entry.get("id"), str)
    ]