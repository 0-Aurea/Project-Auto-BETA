import os
from urllib.parse import urlparse, urlunparse

class AuthMiddleware:
    def __init__(self, proxies):
        self.proxies = proxies

    def add_auth_from_env(self):
        user = os.getenv('PROXY_USER')
        password = os.getenv('PROXY_PASS')
        if not user or not password:
            return

        for scheme in list(self.proxies.keys()):
            proxy_url = self.proxies[scheme]
            parsed = urlparse(proxy_url)
            parsed = parsed._replace(username=user, password=password)
            new_url = urlunparse(parsed)
            self.proxies[scheme] = new_url

if __name__ == "__main__":
    # Example usage
    proxies = {'http': 'http://localhost:8080', 'https': 'https://localhost:8080'}
    auth_middleware = AuthMiddleware(proxies)
    auth_middleware.add_auth_from_env()
    print(proxies)