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
        List of preprocessed data entries as dictionaries
        
    Raises:
        FileNotFoundError: If data_path does not exist
        ValueError: If data cannot be loaded or processed
    """
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data path '{data_path}' does not exist")
    
    try:
        loader = DataLoader(data_path)
        raw_data = loader.load()
    except Exception as e:
        raise ValueError(f"Failed to load data from {data_path}: {str(e)}") from e

    if not isinstance(raw_data, list):
        raise ValueError(f"Expected list of dictionaries, got {type(raw_data)}")
        
    processed_data = process_data(raw_data)
    
    # Validate processing output
    if not all(isinstance(item, dict) and 'id' in item for item in processed_data):
        raise ValueError("Processing resulted in invalid data format")
        
    return processed_data