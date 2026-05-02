from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Returns a new list containing only
    valid entries with normalized keys.
    
    Args:
        data: List of dictionaries containing raw data entries.
        
    Returns:
        List of dictionaries with keys normalized to lowercase and entries
        filtered to include only those with an 'id' field.
    """
    return [
        {key.lower(): value for key, value in entry.items()}
        for entry in data
        if 'id' in entry
    ]