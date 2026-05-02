CONTENT:
```python
import torch
import torch.nn as nn
import torch.optim as optim
from app import Net, ConvNet, train_loader, test_loader

def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Train a simple neural network
    model = Net().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=0.01)
    for epoch in range(10):
        loss, accuracy = train_model(model, device, train_loader, criterion, optimizer)
        print(f"Epoch {epoch+1}, Loss: {loss:.4f}, Accuracy: {accuracy:.4f}")

    # Train a convolutional neural network
    conv_model = ConvNet().to(device)
    conv_criterion = nn.CrossEntropyLoss()
    conv_optimizer = optim.SGD(conv_model.parameters(), lr=0.01)
    for epoch in range(10):
        conv_loss, conv_accuracy = train_conv_model(conv_model, device, train_loader, conv_criterion, conv_optimizer)
        print(f"Epoch {epoch+1}, Loss: {conv_loss:.4f}, Accuracy: {conv_accuracy:.4f}")
```