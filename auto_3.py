import os
import sys
import time
from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Returns a new list containing only
    valid entries with normalized keys.
    
    Args:
        data: List of dictionaries containing raw data entries.
        
    Returns:
        List of processed dictionaries with lowercase keys and valid 'id' fields.
    """
    return [
        {key.lower(): value for key, value in entry.items()}
        for entry in data
        if 'id' in entry
    ]

def validate_data(data: List[Dict[str, Any]]) -> bool:
    """
    Validate that all entries have required fields and proper structure.
    
    Args:
        data: List of dictionaries to validate
        
    Returns:
        True if all entries are valid, False otherwise
    """
    if not isinstance(data, list):
        return False
        
    for entry in data:
        if not isinstance(entry, dict) or 'id' not in entry:
            return False
    return True

if __name__ == "__main__":
    sample_data = [
        {"ID": 1, "Name": "Alice"},
        {"id": 2, "name": "Bob"},
        {"ID": 3}  # Missing Name field
    ]
    
    if validate_data(sample_data):
        processed = process_data(sample_data)
        print(f"Processed {len(processed)} entries:")
        print(processed)
    else:
        print("Invalid data format in sample_data")