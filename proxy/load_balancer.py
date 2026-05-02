import requests
import threading
import logging
from proxy.proxy_handler import ProxyHandler

class LoadBalancer:
    def __init__(self, proxy_handler):
        self.proxy_handler = proxy_handler
        self.current_index = 0
        self.lock = threading.Lock()
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def get_next_proxy(self):
        with self.lock:
            if not self.proxy_handler.proxies:
                return None
            proxy = self.proxy_handler.proxies[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.proxy_handler.proxies)
            return proxy

    def send_request(self, url):
        while True:
            proxy = self.get_next_proxy()
            if not proxy:
                self.logger.error("No proxies available.")
                return None
            try:
                response = requests.get(url, proxies={"http": proxy, "https": proxy}, timeout=10)
                self.proxy_handler.current_proxy = proxy
                self.logger.info(f"Request successful via {proxy}")
                return response
            except requests.exceptions.RequestException as e:
                self.logger.warning(f"Proxy {proxy} failed: {e}")
                self.proxy_handler.proxies.remove(proxy)
                if not self.proxy_handler.proxies:
                    self.logger.error("All proxies failed.")
                    return None

if __name__ == "__main__":
    proxies = ["http://proxy1:8080", "http://proxy2:8080"]
    proxy_handler = ProxyHandler(proxies)
    load_balancer = LoadBalancer(proxy_handler)
    response = load_balancer.send_request("http://example.com")
    if response:
        print(response.text[:500])  # Print first 500 chars of response