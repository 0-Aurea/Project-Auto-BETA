from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.

    Filters out entries without an 'id' field (case-insensitive check) and
    transforms all dictionary keys to lowercase for consistency. Returns a
    new list containing only valid entries with normalized keys.

    Args:
        data: List of dictionaries containing raw data entries.

    Returns:
        List of processed dictionaries with lowercase keys and valid 'id' fields.
    """
    processed = []
    for entry in data:
        # Check if any key matches 'id' case-insensitively
        if not any(key.lower() == 'id' for key in entry):
            continue
            
        # Create new dictionary with lowercase keys
        transformed = {
            key.lower(): value 
            for key, value in entry.items()
        }
        processed.append(transformed)
    return processed