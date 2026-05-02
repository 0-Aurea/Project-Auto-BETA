from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.

    Filters out entries without an 'id' key (case-insensitive) and
    transforms all dictionary keys to lowercase for consistency.

    Args:
        data: A list of dictionaries containing raw data entries. Each
              entry may have varying key cases and may or may not
              include an 'id' key in any case.

    Returns:
        A list of processed dictionaries with all keys in lowercase and
        entries containing an 'id' field. Entries without an 'id' key are
        excluded from the result.
    """
    processed_data = []
    for entry in data:
        # Check if any key in the entry is 'id' (case-insensitive)
        if not any(k.lower() == 'id' for k in entry):
            continue
        # Convert all keys to lowercase
        processed_entry = {key.lower(): value for key, value in entry.items()}
        processed_data.append(processed_entry)
    return processed_data