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
    if 'id' not in entry:
        return None

    # Transform all keys to lowercase
    transformed = {key.lower(): value for key, value in entry.items()}

    # Remove entries with any None values (invalid/missing data)
    if all(value is not None for value in transformed.values()):
        return transformed
    return None


def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.

    Filters out entries without an 'id' field. Transforms all dictionary
    keys to lowercase for consistency. Removes entries with invalid or missing
    data to ensure dataset quality.

    Args:
        data: List of dictionaries containing raw data entries.

    Returns:
        List of processed dictionaries with lowercase keys and valid entries.
    """
    return [entry for entry in data if (entry := _process_entry(entry)) is not None]