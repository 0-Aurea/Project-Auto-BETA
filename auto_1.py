from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries that do not contain an 'id' key (case-sensitive) and
    transforms all dictionary keys in each entry to lowercase for consistent
    data handling.
    
    Args:
        data: List of dictionaries containing raw data entries. Each entry
              must have an 'id' field (exact key name 'id') to be included in
              the processed output.
    
    Returns:
        List of processed dictionaries with all keys converted to lowercase
        and entries filtered to include only those with an 'id' field.
        
    Example:
        Input: [{'Id': 1, 'Name': 'Alice'}, {'id': 2, 'AGE': 30}]
        Output: [{'id': 1, 'name': 'Alice'}, {'id': 2, 'age': 30}]
    """
    return [
        {k.lower(): v for k, v in entry.items()}
        for entry in data
        if 'id' in entry
    ]