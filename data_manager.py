# data_manager.py

# Standard library imports
import os
import logging
import time

# Third-party imports
import pandas as pd
from typing import List, Dict, Any, Optional

# Local application imports
from . import utils
from . import model

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.

    Filters out entries without an 'id' field or where 'id' is None.
    Transforms all dictionary keys to lowercase for consistency.

    Args:
        data: A list of dictionaries representing raw data entries.

    Returns:
        A list of processed dictionaries with lowercase keys and valid 'id's.

    Example:
        >>> data = [{'ID': 1, 'Name': 'Alice'}, {}, {'ID': None}]
        >>> process_data(data)
        [{'id': 1, 'name': 'Alice'}]
    """
    return [
        {key.lower(): value for key, value in entry.items()}
        for entry in data
        if 'id' in entry and entry['id'] is not None
    ]