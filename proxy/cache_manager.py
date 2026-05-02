import datetime
import time

class CacheManager:
    def __init__(self, expiration=300):
        self.cache = {}
        self.default_expiration = expiration

    def get(self, key):
        if key in self.cache:
            item = self.cache[key]
            if self._is_expired(item['timestamp'], self.default_expiration):
                self.delete(key)
                return None
            return item['value']
        return None

    def set(self, key, value, expiration=None):
        self.cache[key] = {
            'value': value,
            'timestamp': datetime.datetime.now(),
            'expiration': expiration or self.default_expiration
        }

    def delete(self, key):
        if key in self.cache:
            del self.cache[key]

    def _is_expired(self, timestamp, expiration):
        return (datetime.datetime.now() - timestamp).total_seconds() > expiration

    def clear(self):
        self.cache.clear()

if __name__ == "__main__":
    cache = CacheManager(expiration=2)
    cache.set("test", "value1")
    print(cache.get("test"))  # Output: value1
    time.sleep(3)
    print(cache.get("test"))  # Output: None
    cache.set("permanent", "value2", expiration=0)
    print(cache.get("permanent"))  # Output: value2
    cache.delete("permanent")
    print(cache.get("permanent"))  # Output: None