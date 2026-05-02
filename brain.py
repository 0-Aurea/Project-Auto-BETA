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
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with lowercase keys and valid IDs
    """
    try:
        # Filter entries with 'id' field and transform keys
        return [
            _transform_keys(item)
            for item in data
            if 'id' in item
        ]
    except (TypeError, AttributeError) as e:
        # Handle cases where input isn't properly structured
        print(f"Data processing error: {e}", file=sys.stderr)
        return []