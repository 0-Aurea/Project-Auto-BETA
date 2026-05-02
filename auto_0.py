import os
import sys
import time
from typing import List, Dict, Any, Optional

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Args:
        data: List of dictionaries containing raw data entries.
        
    Returns:
        Processed data with keys in lowercase and filtered entries.
    """
    return [{key.lower(): value for key, value in item.items()} for item in data]

def main():
    """Main function to execute the data processing workflow."""
    raw_data = [
        {"Name": "Alice", "Age": 30},
        {"Name": "Bob", "Age": 25}
    ]
    processed = process_data(raw_data)
    print(processed)

if __name__ == "__main__":
    main()