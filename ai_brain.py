from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency.
    
    Args:
        data: List of dictionaries containing raw input data
        
    Returns:
        List of processed dictionaries with cleaned data
    """
    return [
        {key.lower(): value for key, value in item.items()}
        for item in data
        if 'id' in item
    ]