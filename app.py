CONTENT:
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
        x = self.relu(self.fc1(x))     # activation function for hidden layer
        x = self.fc2(x)
        return x

# Define a convolutional neural network
class ConvNet(nn.Module):
    def __init__(self):
        super(ConvNet, self).__init__()
        self.conv1 = nn.Conv2d(1, 6, 5)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(6, 16, 5)
        self.fc1 = nn.Linear(16 * 4 * 4, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)

    def forward(self, x):
        x = self.pool(nn.functional.relu(self.conv1(x)))
        x = self.pool(nn.functional.relu(self.conv2(x)))
        x = x.view(-1, 16 * 4 * 4)
        x = nn.functional.relu(self.fc1(x))
        x = nn.functional.relu(self.fc2(x))
        x = self.fc3(x)
        return x

# Load the model
def load_model(model_type):
    if model_type == 'simple':
        model = Net()
    elif model_type == 'conv':
        model = ConvNet()
    else:
        raise ValueError('Invalid model type')
    return model

# Train the model
def train_model(model, X_train, y_train, X_test, y_test):
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.SGD(model.parameters(), lr=0.01)
    for epoch in range(10):
        optimizer.zero_grad()
        outputs = model(torch.tensor(X_train, dtype=torch.float32))
        loss = criterion(outputs, torch.tensor(y_train, dtype=torch.long))
        loss.backward()
        optimizer.step()
    model.eval()
    outputs = model(torch.tensor(X_test, dtype=torch.float32))
    _, predicted = torch.max(outputs, 1)
    accuracy = accuracy_score(y_test, predicted.numpy())
    return accuracy

# Load MNIST dataset
transform = transforms.Compose([transforms.ToTensor()])
trainset = datasets.MNIST('~/.pytorch/MNIST_data/', download=True, train=True, transform=transform)
trainloader = DataLoader(trainset, batch_size=64, shuffle=True)

testset = datasets.MNIST('~/.pytorch/MNIST_data/', download=True, train=False, transform=transform)
testloader = DataLoader(testset, batch_size=64, shuffle=False)

# Train and save models
simple_model = Net()
conv_model = ConvNet()

simple_accuracy = 0
conv_accuracy = 0

for i, data in enumerate(trainloader, 0):
    inputs, labels = data
    inputs = inputs.numpy().reshape(-1, 784)
    labels = labels.numpy()
    if i == 0:
        simple_accuracy = train_model(simple_model, inputs, labels, torch.tensor(testset.data.numpy().reshape(-1, 784), dtype=torch.float32).view(-1, 1, 28, 28), testset.targets.numpy())
        conv_accuracy = train_model(conv_model, inputs.reshape(-1, 1, 28, 28), labels, torch.tensor(testset.data.numpy().reshape(-1, 784), dtype=torch.float32).view(-1, 1, 28, 28), testset.targets.numpy())

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.form['data']
    data = np.array([float(x) for x in data.split(',')])
    model_type = request.form['model_type']
    model = load_model(model_type)
    if model_type == 'simple':
        output = model(torch.tensor(data, dtype=torch.float32))
    elif model_type == 'conv':
        output = model(torch.tensor(data.reshape(1, 1, 28, 28), dtype=torch.float32))
    _, predicted = torch.max(output, 1)
    return jsonify({'prediction': predicted.item()})

if __name__ == '__main__':
    app.run(debug=True)