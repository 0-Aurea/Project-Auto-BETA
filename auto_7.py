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
        data: A list of dictionaries representing raw data entries. Each dictionary
            should have an 'id' key with a string value to be considered valid.
    
    Returns:
        A list of dictionaries with all keys converted to lowercase and only valid
        entries (those with a string 'id') included.
    """
    return [
        {k.lower(): v for k, v in entry.items()}
        for entry in data
        if 'id' in entry and isinstance(entry['id'], str)
    ]