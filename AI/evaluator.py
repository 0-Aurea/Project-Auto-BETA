import requests
import time
import logging
from proxy.proxy_handler import ProxyHandler

class Evaluator:
    """
    Evaluates proxy performance by making HTTP requests through proxies.

    Attributes:
        proxy_handler (ProxyHandler): Manages proxy configuration and rotation.
        logger (logging.Logger): Configured logger for the class.
    """

    def __init__(self, proxy_handler: ProxyHandler, logger: logging.Logger = None):
        """
        Initialize Evaluator with a ProxyHandler instance.

        Args:
            proxy_handler (ProxyHandler): Manages proxy configuration and rotation.
            logger (logging.Logger, optional): Configured logger for the class. Defaults to None.
        """
        self.proxy_handler = proxy_handler
        self.logger = logger if logger else logging.getLogger(__name__)

    def evaluate_proxy(self, url: str, timeout: int = 5) -> dict:
        """
        Evaluate proxy performance by making an HTTP request through the proxy.

        Args:
            url (str): URL to make the HTTP request to.
            timeout (int, optional): Request timeout in seconds. Defaults to 5.

        Returns:
            dict: Dictionary containing the request duration and status code.
        """
        try:
            start_time = time.time()
            response = requests.get(url, proxies=self.proxy_handler.get_proxy(), timeout=timeout)
            end_time = time.time()
            duration = end_time - start_time
            self.logger.info(f"Proxy {self.proxy_handler.get_proxy()} performed in {duration:.2f} seconds")
            return {"duration": duration, "status_code": response.status_code}
        except requests.RequestException as e:
            self.logger.error(f"Request failed: {e}")
            return {"error": str(e)}

    def run_evaluation(self, url: str, num_requests: int = 10) -> list:
        """
        Run multiple evaluations of the proxy performance.

        Args:
            url (str): URL to make the HTTP requests to.
            num_requests (int, optional): Number of requests to make. Defaults to 10.

        Returns:
            list: List of dictionaries containing the request duration and status code.
        """
        results = []
        for _ in range(num_requests):
            results.append(self.evaluate_proxy(url))
        return results