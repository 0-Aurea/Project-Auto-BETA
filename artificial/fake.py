import os
import sys
import time
from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with lowercase keys
    """
    if not data:
        return []
    
    return [{
        key.lower(): value 
        for key, value in item.items() 
        if value is not None
    } for item in data]

def validate_data(data: List[Dict[str, Any]]) -> bool:
    """
    Validate data structure and content.
    
    Args:
        data: List of dictionaries to validate
        
    Returns:
        True if data is valid, False otherwise
    """
    if not isinstance(data, list):
        return False
        
    for item in data:
        if not isinstance(item, dict):
            return False
            
        for key, value in item.items():
            if not isinstance(key, str) or value is None:
                return False
                
    return True

def main(data: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    """
    Main processing pipeline for data transformation.
    
    Args:
        data: Optional input data. If not provided, uses default test data.
        
    Returns:
        Processed and validated data
    """
    if data is None:
        data = [
            {"Name": "Alice", "Age": 30, "City": None},
            {"NAME": "Bob", "AGE": "25", "CITY": "New York"},
            {"name": "Charlie", "age": 35, "city": "London"}
        ]
    
    if not validate_data(data):
        raise ValueError("Invalid data format received")
    
    return process_data(data)