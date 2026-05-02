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
        self.fc1 = nn.Linear(784, 128)  # input layer (28x28 images) -> hidden layer (128 units)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 10)   # hidden layer (128 units) -> output layer (10 units)

    def forward(self, x):
        x = x.view(-1, 784)            # flatten the input data
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

# Define a convolutional neural network
class ConvNet(nn.Module):
    def __init__(self):
        super(ConvNet, self).__init__()
        self.conv1 = nn.Conv2d(1, 6, 5)  # input layer (1x28x28 images) -> convolutional layer (6x24x24)
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool2d(2, 2)   # pooling layer (6x24x24) -> (6x12x12)
        self.conv2 = nn.Conv2d(6, 16, 5) # convolutional layer (6x12x12) -> (16x8x8)
        self.fc1 = nn.Linear(16 * 4 * 4, 120) # flatten layer (16x4x4) -> hidden layer (120 units)
        self.fc2 = nn.Linear(120, 84)   # hidden layer (120 units) -> hidden layer (84 units)
        self.fc3 = nn.Linear(84, 10)    # hidden layer (84 units) -> output layer (10 units)

    def forward(self, x):
        x = self.relu(self.conv1(x))     # convolutional layer
        x = self.pool(x)                # pooling layer
        x = self.relu(self.conv2(x))     # convolutional layer
        x = self.pool(x)                # pooling layer
        x = x.view(-1, 16 * 4 * 4)       # flatten layer
        x = self.relu(self.fc1(x))      # hidden layer
        x = self.relu(self.fc2(x))      # hidden layer
        x = self.fc3(x)                 # output layer
        return x

# Load MNIST dataset
transform = transforms.Compose([transforms.ToTensor()])
train_dataset = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
test_dataset = datasets.MNIST(root='./data', train=False, download=True, transform=transform)
train_loader = DataLoader(dataset=train_dataset, batch_size=64, shuffle=True)
test_loader = DataLoader(dataset=test_dataset, batch_size=64, shuffle=False)

# Define a function to train a model
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

# Define a function to make predictions
def make_prediction(model, device, data):
    model.eval()
    data = torch.tensor(data, dtype=torch.float32).view(1, 1, 28, 28).to(device)
    output = model(data)
    _, predicted = torch.max(output, 1)
    return predicted.item()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.form['data']
    model_type = request.form['model_type']
    data = [float(x) for x in data.split(',')]
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    if model_type == 'simple':
        model = Net().to(device)
    elif model_type == 'conv':
        model = ConvNet().to(device)
    prediction = make_prediction(model, device, data)
    return jsonify({'prediction': prediction})

if __name__ == '__main__':
    app.run(debug=True)
```