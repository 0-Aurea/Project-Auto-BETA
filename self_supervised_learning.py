# Standard library imports
import os
import sys
import time
import random
from typing import List, Dict, Tuple, Optional, Any

# Third-party imports
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torchvision import transforms, models
from torchvision.datasets import CIFAR10
from torchvision.transforms import InterpolationMode

# Local imports
# (Add local imports here if needed)

def set_seed(seed: int = 42) -> None:
    """Set random seeds for reproducibility across Python, NumPy, and PyTorch.
    
    Args:
        seed (int): Seed value for random number generators
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.use_deterministic_algorithms(True)

class CIFAR10DataModule:
    """Data module for CIFAR-10 dataset with standard augmentations."""
    
    def __init__(self, 
                 data_dir: str = "./data",
                 batch_size: int = 256,
                 num_workers: int = 4):
        """
        Initialize data module with training and validation transforms.
        
        Args:
            data_dir: Directory to store dataset
            batch_size: Mini-batch size for data loading
            num_workers: Number of subprocesses for data loading
        """
        self.data_dir = data_dir
        self.batch_size = batch_size
        self.num_workers = num_workers
        self.train_transform = transforms.Compose([
            transforms.RandomResizedCrop(size=32, 
                                         interpolation=InterpolationMode.BICUBIC),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomApply([
                transforms.ColorJitter(brightness=0.4, 
                                     contrast=0.4, 
                                     saturation=0.2,
                                     hue=0.1)
            ], p=0.8),
            transforms.RandomGrayscale(p=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.4914, 0.4822, 0.4465],
                                 std=[0.247, 0.243, 0.261])
        ])
        
    def get_data_loaders(self) -> Tuple[DataLoader, DataLoader]:
        """Create training and validation data loaders."""
        train_dataset = CIFAR10(root=self.data_dir,
                               train=True,
                               download=True,
                               transform=self.train_transform)
                               
        train_loader = DataLoader(train_dataset,
                                 batch_size=self.batch_size,
                                 shuffle=True,
                                 num_workers=self.num_workers,
                                 pin_memory=True)
                                 
        return train_loader

class SelfSupervisedModel(nn.Module):
    """Base class for self-supervised learning models."""
    
    def __init__(self, 
                 feature_dim: int = 128,
                 projection_dim: int = 128):
        """
        Initialize model with feature encoder and projection head.
        
        Args:
            feature_dim: Dimension of feature embeddings
            projection_dim: Dimension of projection head output
        """
        super().__init__()
        self.encoder = models.resnet18(pretrained=False)
        self.encoder.fc = nn.Sequential(
            nn.Linear(self.encoder.fc.in_features, feature_dim),
            nn.BatchNorm1d(feature_dim)
        )
        
        self.projection = nn.Sequential(
            nn.Linear(feature_dim, projection_dim),
            nn.BatchNorm1d(projection_dim)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass through encoder and projection head."""
        features = self.encoder(x)
        projections = self.projection(features)
        return F.normalize(projections, dim=1)

def train_epoch(model: nn.Module,
                train_loader: DataLoader,
                optimizer: torch.optim.Optimizer,
                device: torch.device) -> float:
    """
    Train for one epoch using contrastive loss.
    
    Args:
        model: Neural network model
        train_loader: Training data loader
        optimizer: Optimizer for parameter updates
        device: Computation device (CPU/GPU)
    
    Returns:
        Average loss for the epoch
    """
    model.train()
    total_loss = 0
    
    for batch in train_loader:
        images = batch[0].to(device)
        optimizer.zero_grad()
        
        # Forward pass - assume symmetric augmentation
        projections = model(images)
        loss = contrastive_loss(projections)
        
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    return total_loss / len(train_loader)

def contrastive_loss(projections: torch.Tensor, temperature: float = 0.5) -> torch.Tensor:
    """
    Compute contrastive loss using cosine similarity.
    
    Args:
        projections: Embedding vectors from model
        temperature: Scaling factor for similarity scores
    
    Returns:
        Contrastive loss value
    """
    projections = F.normalize(projections, p=2, dim=1)
    similarity_matrix = torch.matmul(projections, projections.T) / temperature
    
    # Mask diagonal (positive samples are same image views)
    mask = torch.eye(similarity_matrix.size(0), 
                    device=similarity_matrix.device, 
                    dtype=torch.bool)
    similarity_matrix = similarity_matrix.masked_fill(mask, -1e9)
    
    # Compute cross-entropy loss
    logits = F.log_softmax(similarity_matrix, dim=1)
    labels = torch.arange(similarity_matrix.size(0), 
                         device=similarity_matrix.device)
    
    return -logits.gather(1, labels.unsqueeze(1)).mean()

def main():
    """Main training function for self-supervised learning."""
    # Configuration
    config = {
        'seed': 42,
        'batch_size': 256,
        'epochs': 100,
        'learning_rate': 1e-3,
        'weight_decay': 1e-4,
        'temperature': 0.5
    }
    
    # Set seed for reproducibility
    set_seed(config['seed'])
    
    # Device configuration
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Initialize data module
    data_module = CIFAR10DataModule(
        batch_size=config['batch_size']
    )
    train_loader = data_module.get_data_loaders()
    
    # Initialize model
    model = SelfSupervisedModel().to(device)
    
    # Initialize optimizer
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=config['learning_rate'],
        weight_decay=config['weight_decay']
    )
    
    # Training loop
    for epoch in range(config['epochs']):
        loss = train_epoch(
            model=model,
            train_loader=train_loader,
            optimizer=optimizer,
            device=device
        )
        
        print(f"Epoch [{epoch+1}/{config['epochs']}], Loss: {loss:.4f}")
        
if __name__ == "__main__":
    main()