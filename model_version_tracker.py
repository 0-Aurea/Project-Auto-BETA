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
    except ValueError as e:
        raise ValueError(f"Invalid version string: {version_str}") from e

def compare_versions(version1: str, version2: str) -> int:
    """
    Compare two version strings.
    
    Returns:
        1 if version1 is greater, -1 if version2 is greater, 0 if equal.
    """
    v1 = parse_version(version1)
    v2 = parse_version(version2)
    
    if v1 > v2:
        return 1
    elif v1 < v2:
        return -1
    else:
        return 0