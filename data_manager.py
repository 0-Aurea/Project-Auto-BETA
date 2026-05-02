# data_manager.py

# Standard library imports
import os
import logging
import time

# Third-party imports
import pandas as pd
from typing import List, Dict, Any, Optional

# Local application imports
from . import utils
from . import model

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.
    
    Args:
        data: List of dictionaries containing raw data entries
        
    Returns:
        List of processed dictionaries with normalized keys
    """
    if not data:
        logging.warning("Empty data input received")
        return []
        
    try:
        processed = []
        for item in data:
            if 'id' not in item:
                continue  # Skip items without required 'id' field
                
            processed_item = {k.lower(): v for k, v in item.items()}
            processed.append(processed_item)
            
        return processed
        
    except Exception as e:
        logging.error(f"Data processing failed: {str(e)}")
        return []

def save_processed_data(data: List[Dict[str, Any]], 
                       output_path: str = "processed_data.csv") -> bool:
    """
    Save processed data to CSV file
    
    Args:
        data: Processed data to save
        output_path: Path for output file (default: processed_data.csv)
        
    Returns:
        Boolean indicating success status
    """
    try:
        df = pd.DataFrame(data)
        df.to_csv(output_path, index=False)
        logging.info(f"Successfully saved {len(data)} records to {output_path}")
        return True
    except Exception as e:
        logging.error(f"Failed to save data: {str(e)}")
        return False