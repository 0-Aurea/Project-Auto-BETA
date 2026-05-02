# Standard library imports
import os
import logging
import time
from typing import List, Dict, Any, Optional, Tuple

# Third-party imports
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from sklearn.model_selection import train_test_split

# Local application imports
from ai_brain import AutoEncoder
from app import DataProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SelfSupervisedLearningService:
    """Service class for self-supervised learning model training and evaluation."""
    
    def __init__(self, model: Optional[nn.Module] = None, 
                 batch_size: int = 32, learning_rate: float = 1e-3):
        """
        Initialize the self-supervised learning service.
        
        Args:
            model: PyTorch model to use for training
            batch_size: Mini-batch size for training
            learning_rate: Optimizer learning rate
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = model.to(self.device) if model else self._initialize_default_model().to(self.device)
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.criterion = nn.MSELoss()
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=self.learning_rate)
        
    def _initialize_default_model(self) -> nn.Module:
        """Create and return a default autoencoder model."""
        return AutoEncoder(input_dim=784, hidden_dim=256, latent_dim=64)
    
    def _preprocess_data(self, raw_data: List[Dict[str, Any]]) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Convert raw data to PyTorch tensors.
        
        Args:
            raw_data: List of raw data dictionaries
            
        Returns:
            Tuple of (features tensor, labels tensor)
        """
        processor = DataProcessor()
        processed = processor.process_data(raw_data)
        
        features = np.array([item['features'] for item in processed])
        labels = np.array([item['labels'] for item in processed])
        
        return torch.tensor(features, dtype=torch.float32), torch.tensor(labels, dtype=torch.float32)
    
    def train(self, raw_data: List[Dict[str, Any]], 
              epochs: int = 10, validation_split: float = 0.2) -> Dict[str, float]:
        """
        Train the self-supervised model.
        
        Args:
            raw_data: Raw input data to train on
            epochs: Number of training epochs
            validation_split: Fraction of data to use for validation
            
        Returns:
            Dictionary containing training metrics
        """
        # Convert to tensors and split data
        features, _ = self._preprocess_data(raw_data)
        train_features, val_features = train_test_split(features, test_size=validation_split)
        
        # Create data loaders
        train_loader = DataLoader(train_features, batch_size=self.batch_size, shuffle=True)
        val_loader = DataLoader(val_features, batch_size=self.batch_size)
        
        metrics = {"train_loss": [], "val_loss": []}
        
        for epoch in range(epochs):
            epoch_start = time.time()
            train_loss = self._train_epoch(train_loader)
            val_loss = self._validate_epoch(val_loader)
            
            metrics["train_loss"].append(train_loss)
            metrics["val_loss"].append(val_loss)
            
            logger.info(f"Epoch {epoch+1}/{epochs} completed in {time.time()-epoch_start:.2f}s")
            logger.info(f"  Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f}")
            
        return metrics
        
    def _train_epoch(self, data_loader: DataLoader) -> float:
        """Train for one epoch."""
        self.model.train()
        total_loss = 0
        
        for batch in data_loader:
            inputs = batch.to(self.device)
            
            # Create augmented views
            view1, view2 = self._generate_augmentations(inputs)
            
            # Forward pass
            outputs1 = self.model(view1)
            outputs2 = self.model(view2)
            
            # Calculate loss
            loss = self.criterion(outputs1, outputs2)
            
            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            
        return total_loss / len(data_loader)
    
    def _validate_epoch(self, data_loader: DataLoader) -> float:
        """Validate model performance."""
        self.model.eval()
        total_loss = 0
        
        with torch.no_grad():
            for batch in data_loader:
                inputs = batch.to(self.device)
                outputs = self.model(inputs)
                loss = self.criterion(outputs, inputs)
                total_loss += loss.item()
                
        return total_loss / len(data_loader)
    
    def _generate_augmentations(self, inputs: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Generate augmented views of the input data.
        
        Args:
            inputs: Input tensor batch
            
        Returns:
            Tuple of two augmented views
        """
        # Example augmentations - can be customized
        transform = transforms.Compose([
            transforms.RandomResizedCrop(size=(32, 32), scale=(0.8, 1.0)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
            transforms.ToTensor()
        ])
        
        view1 = transform(inputs)
        view2 = transform(inputs)
        return view1, view2
    
    def save_model(self, path: str) -> None:
        """Save model state to disk."""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
        }, path)
        logger.info(f"Model saved to {path}")
        
    def load_model(self, path: str) -> None:
        """Load model state from disk."""
        checkpoint = torch.load(path)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        logger.info(f"Model loaded from {path}")