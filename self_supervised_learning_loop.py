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
    loss_criterion: nn.Module,
    num_epochs: int = 10,
    device: Optional[torch.device] = None
) -> Tuple[nn.Module, Dict[int, float]]:
    """
    Train a self-supervised learning model using the provided data and optimizer.

    Args:
        model: Neural network model to train.
        data_loader: DataLoader providing training batches.
        optimizer: Optimizer for parameter updates.
        loss_criterion: Loss function to optimize.
        num_epochs: Number of training epochs (default: 10).
        device: Computation device (CPU/GPU). If None, uses CUDA if available.

    Returns:
        Tuple containing:
        - Trained model
        - Dictionary mapping epoch numbers to average loss values
    """
    device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    epoch_loss_dict: Dict[int, float] = {}

    for epoch in range(num_epochs):
        model.train()
        total_loss = 0.0
        batch_count = 0

        for batch in data_loader:
            batch_count += 1
            # Handle batch format (assume [inputs, targets] or similar)
            inputs, targets = batch[0].to(device), batch[1].to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = loss_criterion(outputs, targets)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * inputs.size(0)

        avg_epoch_loss = total_loss / len(data_loader.dataset)
        epoch_loss_dict[epoch] = avg_epoch_loss
        logging.info(f"Epoch {epoch} - Average Loss: {avg_epoch_loss:.4f}")

    return model, epoch_loss_dict