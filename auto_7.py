import os
import sys
import time
from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Filters out entries without an 'id' field and transforms all dictionary
    keys to lowercase for consistency. Removes entries with invalid data types.
    
    Args:
        data: List of dictionaries containing raw data entries. Each entry
              should have at minimum an 'id' field.
    
    Returns:
        List of processed dictionaries with lowercase keys and valid entries.
    """
    start_time = time.time()
    
    processed_data = []
    for entry in data:
        try:
            # Skip entries without required 'id' field
            if 'id' not in entry:
                continue
                
            # Create new dictionary with lowercase keys
            processed_entry = {
                key.lower(): value 
                for key, value in entry.items()
                if isinstance(value, (str, int, float, bool))
            }
            
            if len(processed_entry) == len(entry):
                processed_data.append(processed_entry)
                
        except (ValueError, TypeError):
            # Skip entries with unprocessible data
            continue
    
    elapsed_time = time.time() - start_time
    print(f"Processed {len(processed_data)} entries in {elapsed_time:.2f}s")
    return processed_data