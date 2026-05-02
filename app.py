from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Validates that input is a list of dictionaries.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of dictionaries with lowercase keys and valid 'id' fields
        
    Raises:
        ValueError: If input is not a list
    """
    if not isinstance(data, list):
        raise ValueError("Input data must be a list of dictionaries")

    def _process_entry(entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process individual dictionary entry."""
        if not isinstance(entry, dict):
            return None
            
        processed = {key.lower(): value for key, value in entry.items()}
        return processed if 'id' in processed else None

    return [entry for entry in 
            (_process_entry(item) for item in data) 
            if entry is not None]