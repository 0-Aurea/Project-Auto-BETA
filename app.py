CONTENT:
```python
from flask import Flask, render_template, request, jsonify
import torch
import torch.nn as nn
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import numpy as np
from torch.utils.data import Dataset, DataLoader
import torchvision
from torchvision import datasets, transforms

app = Flask(__name__)

# Define a simple neural network
class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.fc1 = nn.Linear(784, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

class ConvNet(nn.Module):
    def __init__(self):
        super(ConvNet, self).__init__()
        self.conv1 = nn.Conv2d(1, 6, kernel_size=3)
        self.conv2 = nn.Conv2d(6, 12, kernel_size=3)
        self.fc1 = nn.Linear(12*4*4, 10)

    def forward(self, x):
        x = torch.relu(self.conv1(x))
        x = torch.relu(self.conv2(x))
        x = x.view(-1, 12*4*4)
        x = self.fc1(x)
        return x

transform = transforms.Compose([transforms.ToTensor()])
train_dataset = datasets.MNIST('~/.pytorch/MNIST_data/', download=True, train=True, transform=transform)
test_dataset = datasets.MNIST('~/.pytorch/MNIST_data/', download=True, train=False, transform=transform)
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(test_dataset, batch_size=64, shuffle=False)

def train_model(model, device, loader, criterion, optimizer):
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    for batch in loader:
        inputs, labels = batch
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs.view(-1, 784))
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        _, predicted = torch.max(outputs, 1)
        correct += (predicted == labels).sum().item()
        total += labels.size(0)
    accuracy = correct / total
    return total_loss / len(loader), accuracy

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.form['data']
    model_type = request.form['model_type']
    if model_type == 'simple':
        model = Net()
    elif model_type == 'conv':
        model = ConvNet()
    inputs = np.array([float(x) for x in data.split(',')])
    inputs = torch.tensor(inputs).view(1, -1)
    outputs = model(inputs)
    _, predicted = torch.max(outputs, 1)
    return jsonify({'prediction': predicted.item()})

if __name__ == '__main__':
    app.run(debug=True)
```