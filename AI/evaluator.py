import requests
import time
import logging
from proxy.proxy_handler import ProxyHandler

class Evaluator:
    def __init__(self, proxy_handler=None):
        self.proxy_handler = proxy_handler
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def evaluate_proxy(self, url, timeout=10):
        if not self.proxy_handler:
            raise ValueError("No proxy handler provided.")
        try:
            start_time = time.time()
            proxies = {
                'http': self.proxy_handler.current_proxy,
                'https': self.proxy_handler.current_proxy
            }
            response = requests.get(url, proxies=proxies, timeout=timeout)
            elapsed_time = time.time() - start_time
            self.logger.info(f"Request to {url} succeeded in {elapsed_time:.2f} seconds with status {response.status_code}")
            return {
                'url': url,
                'status_code': response.status_code,
                'response_time': elapsed_time,
                'success': True
            }
        except Exception as e:
            self.logger.error(f"Request to {url} failed: {str(e)}")
            return {
                'url': url,
                'error': str(e),
                'success': False
            }

if __name__ == "__main__":
    # Example usage
    proxies = [
        'http://proxy1.example.com:8080',
        'http://proxy2.example.com:8080'
    ]
    proxy_handler = ProxyHandler(proxies)
    evaluator = Evaluator(proxy_handler)
    result = evaluator.evaluate_proxy('http://httpbin.org/ip')
    print(result)