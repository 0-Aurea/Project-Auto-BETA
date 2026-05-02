import os
import sys
import time
from typing import List, Dict, Any, Optional


def _process_entry(entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Process a single dictionary entry by transforming keys to lowercase and
    validating data.

    Args:
        entry: Dictionary containing raw data entry.

    Returns:
        Processed dictionary if valid, None otherwise.
    """
    # Transform all keys to lowercase
    transformed = {k.lower(): v for k, v in entry.items()}

    if 'id' not in transformed:
        return None

    return transformed


def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.

    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency.

    Args:
        data: List of dictionaries containing raw data entries.

    Returns:
        List of processed dictionaries with lowercase keys and valid 'id' fields.
    """
    processed_entries = []
    for entry in data:
        processed = _process_entry(entry)
        if processed is not None:
            processed_entries.append(processed)
    return processed_entries