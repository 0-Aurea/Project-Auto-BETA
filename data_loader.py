# Standard library imports
import os
import json
from typing import List, Dict, Any, Optional

# Third-party imports
import pandas as pd  # Assuming pandas might be used for data processing

def load_json_data(file_path: str) -> List[Dict[str, Any]]:
    """
    Load JSON data from a file.
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        List of dictionaries containing the loaded data
        
    Raises:
        FileNotFoundError: If the file does not exist
        json.JSONDecodeError: If the file contains invalid JSON
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Data file not found: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        Processed and normalized data
    """
    if not data:
        return []
    
    return [
        {key.lower(): value for key, value in item.items()}
        for item in data
        if 'id' in item
    ]

def load_and_process_data(file_path: str) -> Optional[List[Dict[str, Any]]]:
    """
    Complete data loading and processing pipeline.
    
    Args:
        file_path: Path to the input JSON file
        
    Returns:
        Processed data or None if an error occurred
    """
    try:
        raw_data = load_json_data(file_path)
        return process_data(raw_data)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error processing data: {e}")
        return None