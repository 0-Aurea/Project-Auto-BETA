import urllib.request
import urllib.error
import logging

class AuthMiddleware:
    def __init__(self, proxy_url, username, password):
        self.proxy_url = proxy_url
        self.username = username
        self.password = password
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def create_opener(self):
        password_mgr = urllib.request.HTTPPasswordMgrWithDefaultRealm()
        password_mgr.add_password(None, self.proxy_url, self.username, self.password)
        auth_handler = urllib.request.HTTPBasicAuthHandler(password_mgr)
        proxy_handler = urllib.request.ProxyHandler({
            'http': self.proxy_url,
            'https': self.proxy_url
        })
        opener = urllib.request.build_opener(proxy_handler, auth_handler)
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        return opener

    def fetch_url(self, url):
        opener = self.create_opener()
        try:
            response = opener.open(url)
            return response.read()
        except urllib.error.URLError as e:
            self.logger.error(f"Failed to fetch URL {url}: {e.reason}")
            return None

if __name__ == "__main__":
    # Example usage
    auth = AuthMiddleware(
        proxy_url='http://example-proxy.com:8080',
        username='user',
        password='pass'
    )
    content = auth.fetch_url('http://httpbin.org/ip')
    if content:
        print(content.decode('utf-8'))