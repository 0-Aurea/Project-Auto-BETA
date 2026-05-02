from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.

    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency.

    Args:
        data: List of dictionaries containing raw data entries.

    Returns:
        List of processed dictionaries with keys in lowercase.
    """
    filtered_data = [entry for entry in data if 'id' in entry]
    processed_data = [{key.lower(): value for key, value in entry.items()} for entry in filtered_data]
    return processed_data