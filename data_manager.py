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
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with lowercase keys and valid 'id's
        
    Example:
        Input: [{'ID': 1, 'Name': 'Alice'}, {'Name': 'Bob'}]
        Output: [{'id': 1, 'name': 'Alice'}]
    """
    processed = []
    for entry in data:
        # Filter entries without 'id' field or with None as 'id'
        if 'id' not in entry or entry['id'] is None:
            logging.debug(f"Skipping entry due to missing or null 'id': {entry}")
            continue
            
        # Convert all keys to lowercase while preserving values
        lowercased = {key.lower(): value for key, value in entry.items()}
        processed.append(lowercased)
        
    return processed