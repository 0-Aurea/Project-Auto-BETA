from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.

    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Validates that input is a list of dictionaries.

    Args:
        data: List of dictionaries containing raw data entries

    Returns:
        List of dictionaries with lowercase keys, including only entries with 'id' field.

    Raises:
        TypeError: If input is not a list or any entry is not a dictionary.

    Example:
        >>> process_data([{'Id': 1, 'Name': 'Alice'}, {'Name': 'Bob'}])
        [{'id': 1, 'name': 'Alice'}]
    """
    if not isinstance(data, list):
        raise TypeError("Input data must be a list.")
    for entry in data:
        if not isinstance(entry, dict):
            raise TypeError("All items in data must be dictionaries.")
    
    return [
        {key.lower(): value for key, value in entry.items()}
        for entry in data
        if 'id' in entry
    ]