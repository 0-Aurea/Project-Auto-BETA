import os
import requests
import torch
from typing import Optional, Any
import logging

class ModelLoader:
    """
    Loads machine learning models, with support for downloading and loading from various formats.

    Attributes:
        model_path (str): Path to existing model file.
    """

    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize ModelLoader with optional model path.

        Args:
            model_path (str, optional): Path to existing model file. Defaults to None.

        Raises:
            ValueError: If model_path is not a string or None.
        """
        if model_path is not None and not isinstance(model_path, str):
            raise ValueError("model_path must be a string or None")
        self.model_path = model_path
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def download_model(self, url: str, destination: str) -> None:
        """
        Download a model from a URL and save it to a destination.

        Args:
            url (str): URL of the model to download.
            destination (str): Path to save the downloaded model.

        Raises:
            requests.RequestException: If the download fails.
        """
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            with open(destination, 'wb') as file:
                for chunk in response.iter_content(chunk_size=8192):
                    file.write(chunk)
            self.logger.info(f"Model downloaded and saved to {destination}")
        except requests.RequestException as e:
            self.logger.error(f"Failed to download model: {e}")

    def load_model(self) -> Any:
        """
        Load a model from the specified model path.

        Returns:
            Any: The loaded model.

        Raises:
            FileNotFoundError: If the model file does not exist.
        """
        if self.model_path is None:
            raise ValueError("Model path is not specified")
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found: {self.model_path}")
        try:
            # Assuming the model is a PyTorch model
            model = torch.load(self.model_path, map_location=torch.device('cpu'))
            self.logger.info(f"Model loaded from {self.model_path}")
            return model
        except Exception as e:
            self.logger.error(f"Failed to load model: {e}")
            raise