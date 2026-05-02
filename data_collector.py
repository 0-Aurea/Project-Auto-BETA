# Standard library imports
import os
import sys
import time
from typing import List, Dict, Any, Optional, Tuple

# Third-party imports
import pandas as pd
from tqdm import tqdm

# Local application imports
from .models import DataCollector
from .utils import validate_data, format_timestamp


class DataCollector:
    """Collects and processes data from multiple sources with validation and error handling."""
    
    def __init__(self, source_paths: List[str], output_dir: str = "./processed_data"):
        """
        Initialize DataCollector with source paths and output directory.
        
        Args:
            source_paths: List of file paths to collect data from
            output_dir: Directory to store processed data (default: ./processed_data)
        """
        self.source_paths = source_paths
        self.output_dir = output_dir
        self._validate_paths()
        self._create_output_dir()
        
    def _validate_paths(self) -> None:
        """Validate all source paths exist and are readable."""
        for path in self.source_paths:
            if not os.path.exists(path):
                raise FileNotFoundError(f"Source path not found: {path}")
            if not os.path.isfile(path):
                raise ValueError(f"Path is not a file: {path}")
                
    def _create_output_dir(self) -> None:
        """Create output directory if it doesn't exist."""
        os.makedirs(self.output_dir, exist_ok=True)
        
    def collect_data(self, batch_size: int = 1000) -> Tuple[pd.DataFrame, List[str]]:
        """
        Collect and process data from all sources.
        
        Args:
            batch_size: Number of records to process per batch
            
        Returns:
            Tuple containing processed DataFrame and list of error messages
        """
        all_data = []
        errors = []
        
        for path in tqdm(self.source_paths, desc="Processing files"):
            try:
                raw_data = self._load_file(path)
                processed = self._process_batch(raw_data, batch_size)
                all_data.extend(processed)
            except Exception as e:
                errors.append(f"Error processing {path}: {str(e)}")
                continue
                
        return pd.DataFrame(all_data), errors
        
    def _load_file(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Load raw data from a file.
        
        Args:
            file_path: Path to the file to load
            
        Returns:
            List of raw data entries
        """
        _, ext = os.path.splitext(file_path)
        try:
            if ext == ".csv":
                return pd.read_csv(file_path).to_dict("records")
            elif ext in [".json", ".jsonl"]:
                return pd.read_json(file_path, lines=(ext == ".jsonl")).to_dict("records")
            else:
                raise ValueError(f"Unsupported file format: {ext}")
        except Exception as e:
            raise ValueError(f"Failed to load {file_path}: {str(e)}")
            
    def _process_batch(self, 
                      data_batch: List[Dict[str, Any]], 
                      batch_size: int) -> List[Dict[str, Any]]:
        """
        Process a batch of data with validation and transformation.
        
        Args:
            data_batch: Raw data batch to process
            batch_size: Maximum number of records to process in this batch
            
        Returns:
            List of processed and validated data entries
        """
        processed = []
        for record in data_batch:
            try:
                validated = validate_data(record)
                transformed = self._transform_record(validated)
                processed.append(transformed)
                
                if len(processed) >= batch_size:
                    self._save_batch(processed)
                    processed = []
            except Exception as e:
                print(f"Error processing record: {str(e)}")
                continue
                
        if processed:
            self._save_batch(processed)
            
        return processed
        
    def _transform_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform a single record into standardized format.
        
        Args:
            record: Validated data record to transform
            
        Returns:
            Transformed record with standardized keys
        """
        return {
            "id": str(record.get("id", "")),
            "timestamp": format_timestamp(record.get("timestamp", time.time())),
            "value": float(record.get("value", 0)),
            "source": os.path.basename(record.get("source_file", "unknown"))
        }
        
    def _save_batch(self, batch: List[Dict[str, Any]]) -> None:
        """
        Save a processed batch to output directory.
        
        Args:
            batch: Processed data batch to save
        """
        timestamp = format_timestamp(time.time())
        output_path = os.path.join(self.output_dir, f"data_{timestamp}.parquet")
        pd.DataFrame(batch).to_parquet(output_path, index=False)