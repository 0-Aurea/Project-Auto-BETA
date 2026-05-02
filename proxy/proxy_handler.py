import requests
from urllib.request import ProxyHandler, build_opener
import logging

class ProxyHandler:
    def __init__(self, proxies=None):
        self.proxies = proxies if proxies else []
        self.current_proxy = None
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def add_proxy(self, proxy_url):
        self.proxies.append(proxy_url)
        self.logger.info(f"Added proxy: {proxy_url}")

    def set_current_proxy(self, index):
        if 0 <= index < len(self.proxies):
            self.current_proxy = self.proxies[index]
            self.logger.info(f"Current proxy set to: {self.current_proxy}")
        else:
            self.logger.error("Invalid proxy index")

    def get_requests_session(self):
        if not self.current_proxy:
            self.logger.warning("No proxy selected, using direct connection")
            return requests.Session()
        
        session = requests.Session()
        proxy = {'http': self.current_proxy, 'https': self.current_proxy}
        session.proxies = proxy
        return session

    def test_proxy(self, test_url="http://httpbin.org/ip"):
        try:
            session = self.get_requests_session()
            response = session.get(test_url, timeout=10)
            self.logger.info(f"Proxy test response: {response.json()}")
            return True
        except Exception as e:
            self.logger.error(f"Proxy test failed: {str(e)}")
            return False

if __name__ == "__main__":
    handler = ProxyHandler([
        "http://user:pass@10.10.1.10:3128",
        "http://10.10.1.11:1080"
    ])
    
    handler.set_current_proxy(0)
    success = handler.test_proxy()
    
    if success:
        session = handler.get_requests_session()
        print("Proxy is working. You can use the session object for requests.")
    else:
        print("Proxy test failed. Trying next proxy...")
        handler.set_current_proxy(1)
        handler.test_proxy()