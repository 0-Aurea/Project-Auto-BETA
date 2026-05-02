from proxy.proxy_handler import ProxyHandler
import requests
import logging
import os
from requests.exceptions import RequestException

class AIModelTrainer:
    """Handles AI model training operations with proxy support and data fetching capabilities.
    
    Attributes:
        proxy_handler: Manages proxy configuration and rotation
        logger: Configured logging instance for this class
    """
    
    def __init__(self, proxies=None):
        """Initialize trainer with optional proxy configuration.
        
        Args:
            proxies: Optional proxy configuration dictionary
        """
        self.proxy_handler = ProxyHandler(proxies)
        self.logger = logging.getLogger(__name__)
        if not self.logger.hasHandlers():
            logging.basicConfig(level=logging.INFO,
                               format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    def fetch_data(self, url, timeout=10):
        """Fetch data from specified URL using configured proxy.
        
        Args:
            url: URL to fetch data from
            timeout: Request timeout in seconds
            
        Returns:
            Response text content
            
        Raises:
            RequestException: If request fails after proxy handling
        """
        try:
            proxy = self.proxy_handler.current_proxy
            if proxy:
                proxies = {'http': proxy, 'https': proxy}
                self.logger.info(f"Fetching {url} via proxy: {proxy}")
                response = requests.get(url, proxies=proxies, timeout=timeout)
                response.raise_for_status()
                self.logger.info(f"Successfully fetched {url} (Status: {response.status_code})")
                return response.text
            else:
                self.logger.warning("No proxy available, making direct request")
                response = requests.get(url, timeout=timeout)
                response.raise_for_status()
                return response.text
                
        except RequestException as e:
            self.logger.error(f"Request failed: {str(e)}")
            self.proxy_handler.rotate_proxy()
            raise