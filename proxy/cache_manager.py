import logging
import time

class CacheManager:
    def __init__(self, expiration_time=300):
        self.cache = {}
        self.expiration_time = expiration_time
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.DEBUG)

    def get(self, url):
        if url in self.cache:
            response_data, timestamp = self.cache[url]
            if time.time() - timestamp < self.expiration_time:
                self.logger.debug(f"Cache hit for {url}")
                return response_data
            else:
                self.logger.debug(f"Cache expired for {url}")
                del self.cache[url]
        else:
            self.logger.debug(f"Cache miss for {url}")
        return None

    def set(self, url, response_data):
        self.cache[url] = (response_data, time.time())
        self.logger.debug(f" Cached response for {url}")

if __name__ == "__main__":
    cache = CacheManager(expiration_time=5)
    cache.set("http://example.com", "Example Data")
    print(cache.get("http://example.com"))  # Should return data
    time.sleep(6)  # Wait past expiration
    print(cache.get("http://example.com"))  # Should return None