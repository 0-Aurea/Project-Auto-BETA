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
                timeout: int = 10) -> List[Dict[str, Any]]:
    """
    Scrape data from a target URL using HTTP GET request and BeautifulSoup parsing.
    
    Args:
        url (str): Target URL to scrape
        headers (Optional[Dict[str, str]]): Request headers for the HTTP request
        params (Optional[Dict[str, Any]]): Query parameters for the request
        timeout (int): Request timeout in seconds (default: 10)
        
    Returns:
        List[Dict[str, Any]]: Parsed data in dictionary format, ready for processing
    """
    try:
        logger.info(f"Initiating request to {url}")
        response = requests.get(
            url,
            headers=headers or {},
            params=params or {},
            timeout=timeout
        )
        response.raise_for_status()
        
    except requests.RequestException as e:
        logger.error(f"Request failed: {str(e)}")
        return []
        
    try:
        soup = BeautifulSoup(response.text, 'html.parser')
        raw_data = helper_function(soup)
        
        # Convert to consistent data structure
        if isinstance(raw_data, list):
            return [dict(item) for item in raw_data]
            
        return []
        
    except Exception as e:
        logger.error(f"Data parsing failed: {str(e)}")
        return []