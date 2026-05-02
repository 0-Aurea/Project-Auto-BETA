# Standard library imports
import os
import sys
import time
import logging
from typing import List, Dict, Any, Optional

# Third-party imports
import requests
from bs4 import BeautifulSoup

# Local application imports
from .utils import helper_function

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def scrape_data(url: str, headers: Optional[Dict[str, str]] = None, 
                params: Optional[Dict[str, Any]] = None, 
                timeout: int = 10, max_retries: int = 3) -> Optional[str]:
    """
    Fetch raw HTML content from a given URL with error handling and retries.
    
    Args:
        url (str): The URL to fetch.
        headers (Optional[Dict[str, str]]): HTTP headers to include in the request.
        params (Optional[Dict[str, Any]]): URL parameters to append to the URL.
        timeout (int): Request timeout in seconds. Defaults to 10.
        max_retries (int): Maximum number of retry attempts. Defaults to 3.
    
    Returns:
        Optional[str]: The raw HTML content if successful, None otherwise.
    """
    # Set default headers if none provided
    if headers is None:
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; DataScraper/1.0; +https://example.com/)'
        }
    
    for retry in range(max_retries):
        try:
            response = requests.get(
                url, 
                headers=headers, 
                params=params, 
                timeout=timeout
            )
            response.raise_for_status()
            return response.text
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed: {e} (Retry {retry + 1}/{max_retries})")
            if retry < max_retries - 1:
                time.sleep(2 ** retry)  # Exponential backoff
            else:
                logger.error(f"Max retries ({max_retries}) exceeded for {url}")
    return None