import requests
import time
import logging
from proxy.proxy_handler import ProxyHandler


class Evaluator:
    """Evaluates proxy performance by making HTTP requests through proxies.

    Attributes:
        proxy_handler (ProxyHandler): Manages proxy configuration and rotation.
        logger (logging.Logger): Configured logger for the class.
    """

    def __init__(self, proxy_handler=None):
        """Initialize Evaluator with optional proxy handler.

        Args:
            proxy_handler (ProxyHandler, optional): Proxy handler instance.
                If None, creates a new ProxyHandler.

        Raises:
            TypeError: If proxy_handler is not None or a ProxyHandler instance.
        """
        if proxy_handler is not None and not isinstance(proxy_handler, ProxyHandler):
            raise TypeError("proxy_handler must be a ProxyHandler instance or None")
        
        self.proxy_handler = proxy_handler if proxy_handler else ProxyHandler()
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def evaluate_proxy(self, proxy, test_url='https://httpbin.org/ip', timeout=10):
        """Evaluate a single proxy's performance by making an HTTP request.

        Args:
            proxy (dict): Proxy configuration in requests-compatible format.
            test_url (str, optional): URL to test against. Defaults to 'https://httpbin.org/ip'.
            timeout (int, optional): Request timeout in seconds. Defaults to 10.

        Returns:
            dict: Evaluation results containing:
                - proxy: The tested proxy configuration
                - response_time: Response time in seconds (None if failed)
                - success: Boolean indicating request success
                - error: Error message if request failed
        """
        try:
            start_time = time.time()
            response = requests.get(test_url, proxies=proxy, timeout=timeout)
            response.raise_for_status()
            response_time = time.time() - start_time
            self.logger.info(f"Proxy {proxy} successful. Response time: {response_time:.2f}s")
            return {
                'proxy': proxy,
                'response_time': response_time,
                'success': True
            }
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Proxy {proxy} failed: {str(e)}")
            return {
                'proxy': proxy,
                'response_time': None,
                'success': False,
                'error': str(e)
            }