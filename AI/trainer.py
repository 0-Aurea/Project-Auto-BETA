from proxy.proxy_handler import ProxyHandler
import requests
import logging
import os

class AIModelTrainer:
    def __init__(self, proxies=None):
        self.proxy_handler = ProxyHandler(proxies)
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)

    def fetch_data(self, url):
        proxy = self.proxy_handler.current_proxy
        if proxy:
            proxies = {'http': proxy, 'https': proxy}
            self.logger.info(f"Fetching {url} via proxy {proxy}")
            return requests.get(url, proxies=proxies).text
        self.logger.info(f"Fetching {url} directly")
        return requests.get(url).text

    def train_model(self, data):
        self.logger.info("Training model...")
        return {"weights": [0.1, 0.2], "bias": 0.05}  # Dummy model

    def save_model(self, model, path="models/ai_model.pth"):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.logger.info(f"Saving model to {path}")
        with open(path, 'w') as f:
            f.write(str(model))

if __name__ == "__main__":
    trainer = AIModelTrainer(proxies=["http://127.0.0.1:8080"])
    try:
        data = trainer.fetch_data("https://example.com/data")
        model = trainer.train_model(data)
        trainer.save_model(model)
    except Exception as e:
        trainer.logger.error(f"Training failed: {e}")