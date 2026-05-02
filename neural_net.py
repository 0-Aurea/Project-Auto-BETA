CONTENT:
```python
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

class NeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size

        self.weights1 = np.random.rand(input_size, hidden_size)
        self.weights2 = np.random.rand(hidden_size, output_size)
        self.bias1 = np.zeros((1, hidden_size))
        self.bias2 = np.zeros((1, output_size))

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))

    def train(self, inputs, targets, learning_rate):
        for _ in range(1000):
            hidden_layer = self.sigmoid(np.dot(inputs, self.weights1) + self.bias1)
            output_layer = self.sigmoid(np.dot(hidden_layer, self.weights2) + self.bias2)

            output_error = targets - output_layer
            output_delta = output_error * output_layer * (1 - output_layer)

            hidden_error = output_delta.dot(self.weights2.T)
            hidden_delta = hidden_error * hidden_layer * (1 - hidden_layer)

            self.weights2 += learning_rate * hidden_layer.T.dot(output_delta)
            self.bias2 += learning_rate * np.sum(output_delta, axis=0, keepdims=True)

            self.weights1 += learning_rate * inputs.T.dot(hidden_delta)
            self.bias1 += learning_rate * np.sum(hidden_delta, axis=0, keepdims=True)

class ConvolutionalNeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        self.conv_net = ConvNet()

    def train(self, inputs, targets, learning_rate):
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.SGD(self.conv_net.parameters(), lr=learning_rate)

        for epoch in range(1000):
            optimizer.zero_grad()
            outputs = self.conv_net(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

class RecurrentNeuralNetwork:
    def __init__(self, input_size, hidden_size, output_size):
        self.recurrent_net = RecurrentNet()

    def train(self, inputs, targets, learning_rate):
        criterion = nn.MSELoss()
        optimizer = optim.SGD(self.recurrent_net.parameters(), lr=learning_rate)

        for epoch in range(1000):
            optimizer.zero_grad()
            outputs = self.recurrent_net(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()

class Transformer:
    def __init__(self, input_size, hidden_size, output_size):
        self.transformer = nn.TransformerEncoderLayer(d_model=input_size, nhead=10, dim_feedforward=hidden_size)

    def train(self, inputs, targets, learning_rate):
        criterion = nn.MSELoss()
        optimizer = optim.SGD(self.transformer.parameters(), lr=learning_rate)

        for epoch in range(1000):
            optimizer.zero_grad()
            outputs = self.transformer(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
```