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
        List of dictionaries with keys converted to lowercase and entries 
        that had an 'id' field (case-insensitive).
    """
    processed_entries = [
        {k.lower(): v for k, v in entry.items()}
        for entry in data
        if any(k.lower() == 'id' for k in entry)
    ]
    return processed_entries