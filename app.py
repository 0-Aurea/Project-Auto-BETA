from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Validates that input is a list of dictionaries.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of dictionaries with lowercase keys and filtered entries
    """
    if not isinstance(data, list):
        raise TypeError("Input data must be a list of dictionaries")
    return [
        {k.lower(): v for k, v in entry.items()}
        for entry in data
        if isinstance(entry, dict) and 'id' in entry
    ]