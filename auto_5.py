from typing import List, Dict, Any

def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and transforming keys to lowercase.

    Filters out entries that do not contain an 'id' field. Transforms all
    dictionary keys in each entry to lowercase for consistency.

    Args:
        data: A list of dictionaries containing raw data entries. Each
              entry may have varying key cases and may or may not
              include an 'id' field.

    Returns:
        A list of processed dictionaries where each key is in lowercase
        and all entries have an 'id' field. Entries without an 'id' are
        excluded from the result.
    """
    return [
        {key.lower(): value for key, value in entry.items()}
        for entry in data
        if 'id' in entry
    ]