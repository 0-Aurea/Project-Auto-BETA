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
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

class AugmentationPipeline:
    """Data augmentation pipeline for self-supervised learning."""
    
    def __init__(self, image_size: int = 224, crop_size: int = 224):
        self.image_size = image_size
        self.crop_size = crop_size
        self.transform = transforms.Compose([
            transforms.RandomResizedCrop(crop_size, scale=(0.08, 1.0),
                                         interpolation=InterpolationMode.BICUBIC),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomApply([
                transforms.ColorJitter(brightness=0.4, contrast=0.4, 
                                     saturation=0.2, hue=0.1)
            ], p=0.8),
            transforms.RandomGrayscale(p=0.2),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                std=[0.229, 0.224, 0.225])
        ])
    
    def __call__(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        return self.transform(x), self.transform(x)

class ProjectionHead(nn.Module):
    """Projection head for contrastive learning."""
    
    def __init__(self, input_dim: int = 2048, hidden_dim: int = 2048, 
                 output_dim: int = 128):
        super().__init__()
        self.projection = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return F.normalize(self.projection(x), dim=1)

class SelfSupervisedModel(nn.Module):
    """Base model for self-supervised learning with projection head."""
    
    def __init__(self, base_model: str = 'resnet50', 
                 feature_dim: int = 2048, projection_dim: int = 128):
        super().__init__()
        self.backbone = getattr(models, base_model)(pretrained=False)
        self.backbone.fc = nn.Identity()  # Remove classification head
        self.projection = ProjectionHead(input_dim=feature_dim,
                                        output_dim=projection_dim)
        
    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        features = self.backbone(x)
        projections = self.projection(features)
        return features, projections

def contrastive_loss(projections1: torch.Tensor, projections2: torch.Tensor,
                    temperature: float = 0.07) -> torch.Tensor:
    """
    Compute NT-Xent contrastive loss.
    
    Args:
        projections1: Embeddings from first augmented view
        projections2: Embeddings from second augmented view
        temperature: Temperature parameter for scaling similarity
    
    Returns:
        Scalar loss value
    """
    projections1 = F.normalize(projections1, dim=1)
    projections2 = F.normalize(projections2, dim=1)
    
    batch_size = projections1.shape[0]
    similarities = (projections1 @ projections2.T) / temperature
    
    # Create labels: positive pairs are (i,i) and (i,i+batch_size)
    labels = torch.arange(batch_size).to(similarities.device)
    loss = (F.cross_entropy(similarities, labels) + 
            F.cross_entropy(similarities.T, labels)) / 2
    return loss

def train_step(model: nn.Module, data_loader: DataLoader, 
              optimizer: torch.optim.Optimizer, device: str) -> float:
    """
    Single training step for self-supervised model.
    
    Args:
        model: Self-supervised model with projection head
        data_loader: DataLoader providing augmented data pairs
        optimizer: Optimizer for parameter updates
        device: Device to use for computation
    
    Returns:
        Average loss for the batch
    """
    model.train()
    total_loss = 0
    for images in data_loader:
        images = images.to(device)
        
        # Get two augmented views of the same image
        view1, view2 = images, images  # In practice, use augmentation pipeline
        
        # Forward pass
        _, proj1 = model(view1)
        _, proj2 = model(view2)
        
        # Compute loss and optimize
        loss = contrastive_loss(proj1, proj2)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    return total_loss / len(data_loader)

def main():
    """Main function to execute self-supervised training."""
    # Configuration
    config = {
        'batch_size': 256,
        'epochs': 100,
        'learning_rate': 1e-3,
        'temperature': 0.07,
        'seed': 42,
        'device': 'cuda' if torch.cuda.is_available() else 'cpu'
    }
    
    # Set seed for reproducibility
    set_seed(config['seed'])
    
    # Initialize model and optimizer
    model = SelfSupervisedModel().to(config['device'])
    optimizer = torch.optim.Adam(model.parameters(), lr=config['learning_rate'])
    
    # Create dataset with augmentations
    transform = AugmentationPipeline()
    dataset = CIFAR10(root='./data', download=True,
                     transform=transforms.ToTensor())
    data_loader = DataLoader(dataset, batch_size=config['batch_size'],
                            num_workers=4, pin_memory=True)
    
    # Training loop
    for epoch in range(config['epochs']):
        start_time = time.time()
        loss = train_step(model, data_loader, optimizer, config['device'])
        print(f"Epoch {epoch+1}/{config['epochs']}, Loss: {loss:.4f}, "
              f"Time: {time.time()-start_time:.2f}s")

if __name__ == "__main__":
    main()