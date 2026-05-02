CONTENT:
```python
import torch
import torch.nn as nn
import torch.optim as optim
from neural_net import NeuralNetwork, ConvolutionalNeuralNetwork, RecurrentNeuralNetwork, Transformer, Autoencoder

def train_model(model, device, loader, criterion, optimizer):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for batch_idx, (data, target) in enumerate(loader):
        data, target = data.to(device), target.to(device)
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

def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Convolutional Neural Network
    model = ConvolutionalNeuralNetwork().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=0.01)

    transform = transforms.Compose([transforms.ToTensor()])
    train_dataset = datasets.MNIST('~/.pytorch/MNIST_data/', download=True, train=True, transform=transform)
    test_dataset = datasets.MNIST('~/.pytorch/MNIST_data/', download=True, train=False, transform=transform)
    train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

    for epoch in range(10):
        loss, accuracy = train_model(model, device, train_loader, criterion, optimizer)
        print(f'Epoch {epoch+1}, Loss: {loss:.4f}, Accuracy: {accuracy:.4f}')

if __name__ == "__main__":
    main()
```