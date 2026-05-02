import os
import sys
import time
import logging
import torch
from torch import nn, optim
from typing import Dict, Any, Tuple, List, Optional
from torch.utils.data import DataLoader

logging.basicConfig(level=logging.INFO)

def train_self_supervised_model(
    model: nn.Module,
    data_loader: DataLoader,
    optimizer: optim.Optimizer,
    num_epochs: int = 10,
    device: Optional[torch.device] = None
) -> Tuple[nn.Module, Dict[int, float]]:
    """
    Train a self-supervised learning model using contrastive learning.
    
    Args:
        model: Neural network model to train
        data_loader: DataLoader containing training samples
        optimizer: Optimization algorithm
        num_epochs: Number of training epochs
        device: Computation device (CPU/GPU)
        
    Returns:
        Trained model and dictionary of epoch-wise losses
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    model.to(device)
    loss_history = {}
    
    for epoch in range(num_epochs):
        epoch_loss = 0.0
        model.train()
        
        for batch in data_loader:
            # Move batch to device
            inputs = batch[0].to(device)
            
            # Forward pass
            embeddings = model(inputs)
            loss = contrastive_loss(embeddings)
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            epoch_loss += loss.item()
        
        avg_loss = epoch_loss / len(data_loader)
        loss_history[epoch] = avg_loss
        logging.info(f"Epoch {epoch+1}/{num_epochs} - Loss: {avg_loss:.4f}")
    
    return model, loss_history

def contrastive_loss(
    embeddings: torch.Tensor,
    temperature: float = 0.07
) -> torch.Tensor:
    """
    Compute contrastive loss using normalized temperature-scaled cross entropy.
    
    Args:
        embeddings: Tensor of shape (batch_size, embedding_dim)
        temperature: Scaling factor for similarity scores
        
    Returns:
        Computed contrastive loss
    """
    # Normalize embeddings
    embeddings = nn.functional.normalize(embeddings, p=2, dim=1)
    
    # Compute similarity matrix
    similarity_matrix = torch.matmul(embeddings, embeddings.T) / temperature
    
    # Create labels (diagonal elements are positive pairs)
    labels = torch.arange(similarity_matrix.size(0)).to(embeddings.device)
    
    # Compute loss
    loss = nn.CrossEntropyLoss()(similarity_matrix, labels)
    return loss

def create_data_loaders(
    dataset: torch.utils.data.Dataset,
    batch_size: int = 256,
    num_workers: int = 4
) -> DataLoader:
    """
    Create DataLoader with optimal configuration for self-supervised learning.
    
    Args:
        dataset: PyTorch Dataset object
        batch_size: Number of samples per batch
        num_workers: Number of worker threads for data loading
        
    Returns:
        Configured DataLoader
    """
    return DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=True if torch.cuda.is_available() else False
    )