import logging
import os
import sys
from typing import NoReturn

def main() -> NoReturn:
    """
    Main function to run the script.

    This script can be used as a placeholder or a starter for a python script 
    in a github workflow.

    Returns:
        None
    """
    try:
        logging.basicConfig(level=logging.INFO)
        logging.info("Running the script")
    except Exception as e:
        logging.error(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()