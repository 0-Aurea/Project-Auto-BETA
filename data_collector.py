# Standard library imports
import os
import sys
import time
from typing import List, Dict, Any, Optional, Tuple

# Third-party imports
import pandas as pd
from tqdm import tqdm

# Local application imports
from .utils import validate_data, format_timestamp


class DataCollector:
    """Collects and processes data from multiple sources with validation and error handling."""
    
    def __init__(self, source_paths: List[str], output_dir: str = "./processed_data"):
        """
        Initialize DataCollector with source paths and output directory.

        Args:
            source_paths: List of file paths to collect data from.
            output_dir: Directory to save processed data. Defaults to "./processed_data".
        """
        self.source_paths = source_paths
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)  # Ensure output directory exists

    def process_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process raw data by filtering and transforming keys to lowercase.

        Filters out entries without an 'id' field and transforms all dictionary
        keys to lowercase for consistency.

        Args:
            data: List of dictionaries containing raw data.

        Returns:
            List of processed dictionaries with lowercase keys and valid 'id' fields.
        """
        processed = []
        for entry in data:
            # Convert keys to lowercase
            lowercased = {key.lower(): value for key, value in entry.items()}
            # Check for 'id' field
            if 'id' in lowercased:
                processed.append(lowercased)
        return processed

    def collect_data(self) -> None:
        """
        Collect and process data from all source paths, saving to output directory.

        Handles errors during data collection and validation, logging issues to stderr.
        """
        for source_path in tqdm(self.source_paths, desc="Collecting data"):
            try:
                # Read data from source
                df = pd.read_csv(source_path)
                # Convert DataFrame to list of dictionaries
                raw_data = df.to_dict(orient='records')
                # Process data
                processed_data = self.process_data(raw_data)
                # Validate data
                if not validate_data(processed_data):
                    print(f"Validation failed for {source_path}", file=sys.stderr)
                    continue
                # Generate output path with timestamp
                filename = os.path.basename(source_path)
                timestamp = format_timestamp()
                output_filename = f"processed_{timestamp}_{filename}"
                output_path = os.path.join(self.output_dir, output_filename)
                # Save processed data
                pd.DataFrame(processed_data).to_csv(output_path, index=False)
            except FileNotFoundError:
                print(f"Source file not found: {source_path}", file=sys.stderr)
            except Exception as e:
                print(f"Error processing {source_path}: {str(e)}", file=sys.stderr)