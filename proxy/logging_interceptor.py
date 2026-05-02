import logging

class LoggingInterceptor:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def log_request(self, method, url):
        self.logger.info(f"Request: {method} {url}")

    def log_response(self, status_code, reason):
        self.logger.info(f"Response: {status_code} {reason}")

if __name__ == "__main__":
    # Example usage
    interceptor = LoggingInterceptor()
    interceptor.log_request("GET", "https://example.com")
    interceptor.log_response(200, "OK")