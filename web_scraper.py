import time
import random
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup

def scrape_website(url: str, max_retries: int = 3, timeout: int = 10) -> Optional[List[Dict[str, Any]]]:
    """
    Scrape and parse HTML content from a given URL with retry logic.
    
    Args:
        url: Target URL to scrape
        max_retries: Maximum number of retry attempts (default: 3)
        timeout: Request timeout in seconds (default: 10)
        
    Returns:
        List of dictionaries containing scraped data, or None if all retries fail
        
    Raises:
        ValueError: If URL is empty or invalid
    """
    if not url.strip():
        raise ValueError("URL cannot be empty")
        
    headers = {
        'User-Agent': 'WebScraper/1.0 (https://example.com/scraper; scraper@example.com)'
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Example data extraction - replace with actual implementation
            data = []
            for item in soup.find_all('div', class_='item'):
                data.append({
                    'title': item.find('h2').text.strip() if item.find('h2') else None,
                    'content': item.find('p').text.strip() if item.find('p') else None
                })
            
            return data
            
        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                print(f"Request failed after {max_retries} attempts: {str(e)}", file=sys.stderr)
                return None
                
            delay = 1 + (attempt * 0.5) + random.random()
            print(f"Attempt {attempt + 1} failed. Retrying in {delay:.1f} seconds...")
            time.sleep(delay)
    
    return None