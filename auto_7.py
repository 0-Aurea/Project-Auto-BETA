import os
import sys
import time
from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering entries with valid 'id' and converting keys to lowercase.
    
    Filters out entries that do not contain an 'id' key or where the 'id' is not a string.
    Transforms all keys in the remaining entries to lowercase for consistency.
    
    Args:
        data: A list of dictionaries representing raw data entries. Each entry is a dict
              with string keys and arbitrary values.
    
    Returns:
        A list of dictionaries with the same entries as input, but filtered to include only
        those with valid 'id' strings, and with all keys converted to lowercase.
    """
    return [
        {k.lower(): v for k, v in entry.items()}
        for entry in data
        if 'id' in entry and isinstance(entry['id'], str)
    ]