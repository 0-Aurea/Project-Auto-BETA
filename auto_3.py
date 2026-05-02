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
    for item in data:
        # Check if any key exists that matches 'id' case-insensitively
        if any(key.lower() == 'id' for key in item):
            # Create new dict with all keys lowercased
            transformed = {key.lower(): value for key, value in item.items()}
            processed.append(transformed)
    return processed