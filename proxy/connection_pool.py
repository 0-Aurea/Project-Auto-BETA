import queue
import logging
from proxy.proxy_handler import ProxyHandler
import requests

class ConnectionPool:
    def __init__(self, proxies=None, max_pool_size=10):
        self.proxies = proxies or []
        self.max_pool_size = max_pool_size
        self.pool = queue.Queue(max_pool_size)
        self.logger = logging.getLogger(__name__)
        for proxy in self.proxies:
            try:
                self.pool.put_nowait(ProxyHandler([proxy]))
            except queue.Full:
                self.logger.warning("Proxy pool is full, skipping proxy: %s", proxy)

    def get_connection(self):
        try:
            return self.pool.get_nowait()
        except queue.Empty:
            self.logger.error("No available connections in the pool")
            raise queue.Empty("No available connections in the pool")

    def return_connection(self, connection):
        try:
            self.pool.put_nowait(connection)
        except queue.Full:
            self.logger.warning("Connection pool is full, discarding connection")

    def validate_proxy(self, proxy):
        try:
            response = requests.get('http://httpbin.org/ip', proxies=proxy, timeout=5)
            return response.status_code == 200
        except:
            return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    proxies = [
        {'http': 'http://user:pass@10.10.1.10:3128', 'https': 'http://10.10.1.10:1080'},
        # Add more proxies as needed
    ]
    pool = ConnectionPool(proxies=proxies, max_pool_size=5)
    try:
        conn = pool.get_connection()
        # Example usage of ProxyHandler
        print("Connection retrieved from pool")
        pool.return_connection(conn)
    except queue.Empty:
        print("Failed to retrieve connection")