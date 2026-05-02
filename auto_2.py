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
        Processed dictionary if valid (contains 'id' field), None otherwise.
    """
    # Transform all keys to lowercase
    transformed = {k.lower(): v for k, v in entry.items()}

    # Validate required 'id' field exists after transformation
    if 'id' not in transformed:
        return None

    return transformed