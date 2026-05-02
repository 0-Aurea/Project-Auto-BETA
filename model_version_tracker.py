import os
import json
from typing import List, Tuple, Optional

def parse_version(version_str: str) -> List[int]:
    """
    Parse a version string into a list of integers for comparison.
    
    Args:
        version_str: A string representing a version (e.g., '1.2.3').
        
    Returns:
        List of integers representing the version.
        
    Raises:
        ValueError: If the version string contains non-integer parts.
    """
    try:
        return [int(part) for part in version_str.split('.')]
    except ValueError:
        raise ValueError(f"Invalid version string '{version_str}': "
                         "All version parts must be integers.") from None