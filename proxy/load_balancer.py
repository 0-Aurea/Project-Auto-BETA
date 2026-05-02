from collections import deque
import requests
import os

class LoadBalancer:
    def __init__(self, servers=None):
        self.servers = deque()
        if servers:
            self.set_servers(servers)
    
    def set_servers(self, servers):
        """Set list of servers/proxies to balance between"""
        self.servers = deque(servers)
    
    def balance(self):
        """Round-robin selection of next server"""
        if not self.servers:
            raise ValueError("No servers available")
        server = self.servers.popleft()
        self.servers.append(server)
        return server
    
    def send_request(self, method, url, **kwargs):
        """Send request through currently selected server"""
        proxy_url = self.balance()
        proxies = {
            'http': proxy_url,
            'https': proxy_url
        }
        kwargs['proxies'] = proxies
        return requests.request(method, url, **kwargs)

    @classmethod
    def from_env(cls):
        """Create LoadBalancer from PROXY_SERVER_* env vars"""
        servers = []
        i = 0
        while True:
            var_name = f'PROXY_SERVER_{i}'
            server = os.getenv(var_name)
            if server is None:
                break
            servers.append(server)
            i += 1
        return cls(servers)

if __name__ == "__main__":
    # Example usage with direct servers
    lb = LoadBalancer(["http://proxy1:8080", "http://proxy2:8080"])
    response = lb.send_request('GET', 'http://example.com')
    print(f"Status code: {response.status_code}")
    
    # Example usage with environment variables
    # Set PROXY_SERVER_0=http://proxy3:8080 etc.
    # lb_env = LoadBalancer.from_env()
    # response_env = lb_env.send_request('GET', 'http://example.com')
    # print(f"Env-based status code: {response_env.status_code}")