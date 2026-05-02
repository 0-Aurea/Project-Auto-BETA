import os
import requests
import torch

class ModelLoader:
    def __init__(self, model_path=None):
        self.model_path = model_path

    def download_model(self, url, destination, proxies=None):
        response = requests.get(url, proxies=proxies)
        response.raise_for_status()
        with open(destination, 'wb') as f:
            f.write(response.content)
        self.model_path = destination

    def load_model(self, model_format='pytorch'):
        if model_format == 'pytorch':
            return torch.load(self.model_path)
        else:
            raise ValueError(f"Unsupported model format: {model_format}")

if __name__ == "__main__":
    loader = ModelLoader()
    loader.download_model("https://example.com/model.pth", "model.pth", 
                          proxies={"http": "http://10.10.1.10:3128", "https": "http://10.10.1.10:1080"})
    model = loader.load_model()
    print("Model loaded:", model)