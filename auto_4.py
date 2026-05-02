import os
import sys
import time
from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Preserves original data structure
    while ensuring predictable key access.
    
    Args:
        data: List of dictionaries containing raw data entries. Each entry
              should have an 'id' field to pass filtering.
    
    Returns:
        List of processed dictionaries with lowercase keys and valid 'id' fields.
    """
    if not data:
        return []
    
    return [
        {key.lower(): value for key, value in entry.items()}
        for entry in data
        if 'id' in entry
    ]

def validate_data(data: List[Dict[str, Any]]) -> bool:
    """
    Validate data structure consistency.
    
    Checks if all entries have the required 'id' field after processing.
    
    Args:
        data: List of dictionaries to validate
    
    Returns:
        True if all entries have 'id' field, False otherwise
    """
    return all('id' in entry for entry in data)

def main():
    """Example usage of processing pipeline."""
    sample_data = [
        {'ID': 1, 'Name': 'Alice'},
        {'id': 2, 'name': 'Bob'},
        {'identifier': 3, 'NAME': 'Charlie'},
        {'id': 4}
    ]
    
    processed = process_data(sample_data)
    print(f"Original count: {len(sample_data)}")
    print(f"Processed count: {len(processed)}")
    print(f"Validation passed: {validate_data(processed)}")
    print(f"First entry: {processed[0] if processed else 'None'}")

if __name__ == "__main__":
    main()