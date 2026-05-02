import os
import requests
from .proxy_handler import ProxyHandler

class ConnectionPool:
    def __init__(self):
        self.proxy_handler = ProxyHandler()
        self.proxy_handler.set_from_env()
        self.session = requests.Session()
        self.session.proxies = self.proxy_handler.proxies

    def get(self, url, **kwargs):
        return self.session.get(url, **kwargs)

    def post(self, url, **kwargs):
        return self.session.post(url, **kwargs)

    def close(self):
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

if __name__ == '__main__':
    with ConnectionPool() as pool:
        response = pool.get('https://example.com')
        print(response.status_code)