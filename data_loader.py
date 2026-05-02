import os
import json
from typing import List, Dict, Any

def load_json_data(file_path: str) -> List[Dict[str, Any]]:
    """
    Load and validate JSON data from a file.

    Args:
        file_path: Path to the JSON file

    Returns:
        List of dictionaries containing the loaded data

    Raises:
        FileNotFoundError: If the file does not exist or is not a file
        json.JSONDecodeError: If the file contains invalid JSON
        ValueError: If the JSON content is not a list or contains non-dictionary elements
    """
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {file_path}") from None

    if not isinstance(data, list):
        raise ValueError(f"JSON content at {file_path} is not a list")
    
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Element at index {i} is not a dictionary")
    
    return data