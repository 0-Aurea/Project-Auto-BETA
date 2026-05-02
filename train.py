# Standard library imports
import os
import sys
import time
from typing import List, Dict, Any, Optional

# Third-party imports
import numpy as np
import pandas as pd

# Local application imports
from data_loader import DataLoader
from ai_brain import process_data


def load_training_data(data_path: str) -> List[Dict[str, Any]]:
    """Load and preprocess training data from specified path.
    
    Args:
        data_path: Path to training data file/folder
        
    Returns:
        List of processed data entries as dictionaries
        
    Raises:
        FileNotFoundError: If data_path does not exist
        ValueError: If data cannot be loaded or processed
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"The data path {data_path} does not exist.")
    
    try:
        raw_data = DataLoader.load(data_path)
    except Exception as e:
        raise ValueError(f"Failed to load data from {data_path}: {str(e)}") from e
    
    # Convert DataFrame to list of dicts if necessary
    if isinstance(raw_data, pd.DataFrame):
        raw_data = raw_data.to_dict('records')
    elif not isinstance(raw_data, list):
        raise ValueError("Loaded data must be a list or DataFrame.")
    
    try:
        processed_data = process_data(raw_data)
    except Exception as e:
        raise ValueError(f"Data processing failed: {str(e)}") from e
    
    return processed_data