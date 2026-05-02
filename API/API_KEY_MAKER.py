import os
import sys
import logging

def generate_api_key(length: int = 32) -> str:
    """
    Generates a random API key of a specified length.

    Args:
        length (int): The length of the API key. Defaults to 32.

    Returns:
        str: A random API key.
    """
    try:
        import secrets
        import string
        characters = string.ascii_letters + string.digits
        api_key = ''.join(secrets.choice(characters) for _ in range(length))
        logging.info(f"Generated API key: {api_key}")
        return api_key
    except Exception as e:
        logging.error(f"Failed to generate API key: {e}")
        return None

def main() -> None:
    """
    Main function to run the script.

    This script generates a random API key.

    Returns:
        None
    """
    try:
        logging.basicConfig(level=logging.INFO)
        api_key = generate_api_key()
        if api_key:
            print(api_key)
    except Exception as e:
        logging.error(f"An error occurred: {e}")

if __name__ == "__main__":
    main()