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

    def __init__(self, proxy_handler: ProxyHandler):
        """Initialize Evaluator with a ProxyHandler instance.

        Args:
            proxy_handler (ProxyHandler): Instance managing proxy configuration.
        """
        self.proxy_handler = proxy_handler
        self.logger = logging.getLogger(__name__)

    def evaluate_proxy(self, proxy_url: str) -> dict:
        """Evaluate the performance of a proxy by making an HTTP request.

        Args:
            proxy_url (str): The URL of the proxy to evaluate.

        Returns:
            dict: A dictionary containing evaluation results with keys:
                - success (bool): Whether the request was successful.
                - response_time (float | None): Time taken in seconds, or None if failed.
                - error (str | None): Error message if failed, else None.
        """
        session = self.proxy_handler.get_session(proxy_url)
        start_time = time.time()
        try:
            response = session.get('http://httpbin.org/ip', timeout=10)
            response.raise_for_status()
            response_time = time.time() - start_time
            self.logger.info(f"Proxy {proxy_url} succeeded in {response_time:.2f}s")
            return {
                'success': True,
                'response_time': response_time,
                'error': None
            }
        except requests.exceptions.RequestException as e:
            error_msg = str(e)
            self.logger.error(f"Proxy {proxy_url} failed: {error_msg}")
            return {
                'success': False,
                'response_time': None,
                'error': error_msg
            }