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
        print(f"Epoch {epoch+1}, Loss: {loss:.4f}, Accuracy: {accuracy:.2f}")

    # Evaluate the model
    accuracy = evaluate_model(model, device, test_loader)
    print(f"Test Accuracy: {accuracy:.2f}")

    # Train a convolutional neural network
    model = ConvNet().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=0.01)
    for epoch in range(10):
        loss, accuracy = train_model(model, device, train_loader, criterion, optimizer)
        print(f"Epoch {epoch+1}, Loss: {loss:.4f}, Accuracy: {accuracy:.2f}")

    # Evaluate the model
    accuracy = evaluate_model(model, device, test_loader)
    print(f"Test Accuracy: {accuracy:.2f}")

def train_model(model, device, loader, criterion, optimizer):
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    for batch_idx, (data, target) in enumerate(loader):
        data, target = data.to(device), target.to(device)
        data = data.view(-1, 784)
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        _, predicted = torch.max(output, 1)
        correct += (predicted == target).sum().item()
        total += target.size(0)
    accuracy = correct / total
    return total_loss / len(loader), accuracy

def evaluate_model(model, device, loader):
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for data, target in loader:
            data, target = data.to(device), target.to(device)
            data = data.view(-1, 784)
            output = model(data)
            _, predicted = torch.max(output, 1)
            correct += (predicted == target).sum().item()
            total += target.size(0)
    accuracy = correct / total
    return accuracy

if __name__ == '__main__':
    main()