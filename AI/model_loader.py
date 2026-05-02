import os
import requests
import torch
from typing import Optional, Any


class ModelLoader:
    """Loads machine learning models, with support for downloading and loading from various formats."""

    def __init__(self, model_path: Optional[str] = None):
        """Initialize ModelLoader with optional model path.

        Args:
            model_path: Path to existing model file. Defaults to None.
        """
        self.model_path = model_path

    def download_model(self, url: str, destination: str, proxies: Optional[dict] = None) -> None:
        """Download model from URL to destination path.

        Args:
            url: URL to download model from.
            destination: File path to save model to.
            proxies: Optional dictionary of proxy settings.

        Raises:
            requests.HTTPError: If download fails.
            IOError: If writing to destination fails.
        """
        try:
            os.makedirs(os.path.dirname(destination), exist_ok=True)
            response = requests.get(url, proxies=proxies)
            response.raise_for_status()
            with open(destination, 'wb') as f:
                f.write(response.content)
            self.model_path = destination
        except requests.RequestException as e:
            raise RuntimeError(f"Model download failed: {e}") from e
        except IOError as e:
            raise RuntimeError(f"Failed to write model to {destination}: {e}") from e

    def load_model(self, model_format: str = 'pytorch') -> Any:
        """Load model from self.model_path in specified format.

        Args:
            model_format: Model format (currently only 'pytorch' supported).

        Returns:
            Loaded model object or state dict.

        Raises:
            ValueError: If model path is not set or format is unsupported.
            RuntimeError: If model loading fails.
        """
        if self.model_path is None:
            raise ValueError("Model path not set. Download model first or provide a path.")

        if model_format == 'pytorch':
            try:
                return torch.load(self.model_path, map_location=torch.device('cpu'))
            except Exception as e:
                raise RuntimeError(f"Failed to load PyTorch model from {self.model_path}: {e}") from e
        else:
            raise ValueError(f"Unsupported model format: {model_format}")