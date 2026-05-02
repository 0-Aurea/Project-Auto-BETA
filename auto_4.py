from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field (case-sensitive) and
    transforms all dictionary keys to lowercase for consistency.
    Preserves original data structure while ensuring predictable key access.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with lowercase keys and
        entries containing the required 'id' field
    """
    return [
        {key.lower(): value for key, value in item.items()}
        for item in data
        if 'id' in item
    ]