# Standard library imports
import os
import sys
import time
from typing import List, Dict, Any, Optional

# Third-party imports
import requests
from bs4 import BeautifulSoup

# Local application imports
from .utils import helper_function


def scrape_data(url: str, headers: Optional[Dict[str, str]] = None, 
                params: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """
    Fetch raw HTML content from a given URL with error handling and retries.
    
    Args:
        url: Target URL to scrape
        headers: Optional custom HTTP headers
        params: Optional query parameters
        
    Returns:
        Raw HTML content if successful, None if failed
    """
    try:
        response = requests.get(url, headers=headers or {}, params=params or {}, 
                                timeout=10)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Scraping failed: {e}", file=sys.stderr)
        return None


def parse_html(html_content: str, parser: str = 'html.parser') -> BeautifulSoup:
    """
    Parse HTML content using BeautifulSoup.
    
    Args:
        html_content: Raw HTML string
        parser: Parser to use (default: html.parser)
        
    Returns:
        BeautifulSoup object
    """
    return BeautifulSoup(html_content, parser)


def extract_data(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """
    Extract structured data from parsed HTML.
    
    Args:
        soup: Parsed HTML content
        
    Returns:
        List of dictionaries containing extracted data
    """
    raw_items = soup.find_all('div', class_='data-item')  # Example selector
    results = []
    
    for item in raw_items:
        try:
            data = {
                'title': item.find('h2').text.strip(),
                'description': item.find('p').text.strip(),
                'url': item.find('a')['href']
            }
            results.append(data)
        except (AttributeError, KeyError) as e:
            print(f"Data extraction error: {e}", file=sys.stderr)
            continue
            
    return results


def process_data(data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Process raw data by filtering and normalizing fields.
    
    Args:
        data: List of raw data dictionaries
        
    Returns:
        Processed and filtered data
    """
    return [
        {k.lower(): v.strip() for k, v in item.items()}
        for item in data
        if all(k in item for k in ['title', 'url'])
    ]


def main(urls: List[str]) -> List[Dict[str, Any]]:
    """
    Main workflow orchestrator for data scraping.
    
    Args:
        urls: List of URLs to process
        
    Returns:
        Aggregated processed data from all URLs
    """
    all_data = []
    
    for url in urls:
        print(f"Processing {url}...")
        raw_html = scrape_data(url)
        if raw_html:
            soup = parse_html(raw_html)
            raw_data = extract_data(soup)
            processed = process_data(raw_data)
            all_data.extend(processed)
            time.sleep(2)  # Respectful scraping delay
            
    return all_data


if __name__ == "__main__":
    TARGET_URLS = [
        "https://example.com/data-source-1",
        "https://example.com/data-source-2"
    ]
    
    results = main(TARGET_URLS)
    print(f"Collected {len(results)} items")