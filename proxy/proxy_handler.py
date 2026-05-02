import os
import requests

class ProxyHandler:
    def __init__(self):
        self.proxies = {}

    def set_from_env(self):
        """Populate proxies from environment variables"""
        http_proxy = os.getenv('HTTP_PROXY')
        https_proxy = os.getenv('HTTPS_PROXY')
        
        if http_proxy:
            self.proxies['http'] = http_proxy
        if https_proxy:
            self.proxies['https'] = https_proxy
        return self

    def get_proxies(self):
        """Return current proxy configuration"""
        return self.proxies.copy()

    def clear_proxies(self):
        """Reset proxy configuration"""
        self.proxies = {}
        return self

if __name__ == '__main__':
    handler = ProxyHandler().set_from_env()
    print("Current proxy configuration:")
    print(handler.get_proxies())
    
    # Example usage with requests
    try:
        response = requests.get(
            'https://httpbin.org/get', 
            proxies=handler.get_proxies(),
            timeout=5
        )
        print(f"\nTest request status code: {response.status_code}")
        print("Response IP:", response.json()['origin'])
    except requests.RequestException as e:
        print(f"Request failed: {str(e)}")