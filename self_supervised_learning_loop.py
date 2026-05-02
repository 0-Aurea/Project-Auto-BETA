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
    Train a self-supervised learning model using the provided data loader and optimizer.

    Args:
        model: Neural network model to train.
        data_loader: DataLoader providing training data.
        optimizer: Optimizer for updating model parameters.
        num_epochs: Number of training epochs (default: 10).
        device: Target device (e.g., 'cuda', 'cpu'). If None, uses GPU if available.

    Returns:
        Tuple containing:
        - Trained model
        - Dictionary mapping epoch number to average loss
    """
    # Set device
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)

    # Initialize loss tracking
    epoch_losses = {}
    criterion = nn.CrossEntropyLoss()  # Assuming classification task

    # Training loop
    model.train()
    for epoch in range(num_epochs):
        total_loss = 0.0
        for batch in data_loader:
            # Move data to device
            inputs, targets = batch
            inputs, targets = inputs.to(device), targets.to(device)

            # Forward pass
            outputs = model(inputs)
            loss = criterion(outputs, targets)

            # Backward pass and optimize
            optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)  # Gradient clipping
            optimizer.step()

            total_loss += loss.item() * inputs.size(0)

        # Calculate epoch loss
        avg_loss = total_loss / len(data_loader.dataset)
        epoch_losses[epoch] = avg_loss
        logging.info(f"Epoch {epoch + 1}/{num_epochs}, Loss: {avg_loss:.4f}")

    return model, epoch_losses