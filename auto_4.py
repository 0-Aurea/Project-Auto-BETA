from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Preserves original data structure
    while ensuring predictable key access.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with lowercase keys and valid 'id' fields
    """
    return [
        {k.lower(): v for k, v in item.items()}
        for item in data
        if isinstance(item, dict) and 'id' in item
    ]