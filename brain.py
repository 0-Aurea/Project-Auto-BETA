import os
import sys
import time
from typing import List, Dict, Any, Optional

def _transform_keys(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert all dictionary keys to lowercase.
    
    Args:
        item: Dictionary with potentially mixed-case keys
        
    Returns:
        Dictionary with all keys converted to lowercase
    """
    return {key.lower(): value for key, value in item.items()}

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field (case-insensitive check) and 
    transforms all dictionary keys to lowercase for consistency.
    
    Args:
        data: List of dictionaries with potentially mixed-case keys
        
    Returns:
        List of processed dictionaries with lowercase keys and valid 'id' fields
    """
    processed = []
    for item in data:
        transformed = _transform_keys(item)
        if "id" in transformed:
            processed.append(transformed)
    return processed