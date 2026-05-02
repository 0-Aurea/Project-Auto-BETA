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
                Defaults to None.
        """
        self.proxy_handler = proxy_handler
        self.logger = logging.getLogger(__name__)
        if not self.logger.hasHandlers():
            logging.basicConfig(level=logging.INFO)

    def evaluate_proxy(self, url, timeout=10):
        """Evaluate proxy performance by making a request to the target URL.

        Args:
            url (str): URL to request using the proxy.
            timeout (int, optional): Request timeout in seconds. Defaults to 10.

        Returns:
            dict: Evaluation results with keys:
                - success (bool): Whether the request succeeded.
                - response_time (float): Time taken in seconds (if successful).
                - status_code (int): HTTP status code (if successful).
                - error (str): Error description (if failed).
        """
        if not self.proxy_handler:
            raise ValueError("No proxy handler provided.")

        try:
            start_time = time.time()
            proxy = self.proxy_handler.get_proxy()
            response = requests.get(url, timeout=timeout, proxies=proxy)
            elapsed_time = time.time() - start_time

            self.logger.info(
                f"Request to {url} succeeded in {elapsed_time:.2f} seconds "
                f"with status {response.status_code}"
            )

            return {
                'success': True,
                'response_time': elapsed_time,
                'status_code': response.status_code
            }

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }