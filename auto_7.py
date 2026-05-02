import os
import sys
from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering entries with valid 'id' and converting keys to lowercase.

    Filters out entries that do not contain an 'id' key or where the 'id' is not a string.
    Transforms all keys in the remaining entries to lowercase for consistency. Note that
    keys differing only by case (e.g., 'Key' and 'key') will result in the last occurrence
    overwriting previous ones after conversion.

    Args:
        data: A list of dictionaries representing raw data entries.

    Returns:
        A list of processed dictionaries with lowercase keys and valid 'id' fields.
    """
    return [
        {k.lower(): v for k, v in entry.items()}
        for entry in data
        if 'id' in entry and isinstance(entry['id'], str)
    ]