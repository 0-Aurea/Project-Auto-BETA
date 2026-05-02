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
        ValueError: If the JSON content is not a list of dictionaries
        IOError: If the file cannot be read (e.g., permission issues)
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"The file {file_path} does not exist.")
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"{file_path} is not a file.")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except json.JSONDecodeError as e:
        raise json.JSONDecodeError(
            f"Invalid JSON in {file_path}: {e}", 
            e.doc, 
            e.pos
        )
    
    if not isinstance(data, list):
        raise ValueError(f"Expected a list of dictionaries, got {type(data)}")
    
    # Validate all items are dictionaries
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            raise ValueError(f"Item at index {i} is not a dictionary")
    
    return data