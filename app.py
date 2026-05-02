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
        self.conv1 = nn.Conv2d(1, 10, kernel_size=5)
        self.conv2 = nn.Conv2d(10, 20, kernel_size=5)
        self.conv2_drop = nn.Dropout2d()
        self.fc1 = nn.Linear(320, 50)
        self.fc2 = nn.Linear(50, 10)

    def forward(self, x):
        x = nn.functional.relu(nn.functional.max_pool2d(self.conv1(x), 2))
        x = nn.functional.relu(nn.functional.max_pool2d(self.conv2_drop(self.conv2(x)), 2))
        x = x.view(-1, 320)
        x = nn.functional.relu(self.fc1(x))
        x = self.fc2(x)
        return nn.functional.log_softmax(x, dim=1)

class RecurrentNet(nn.Module):
    def __init__(self):
        super(RecurrentNet, self).__init__()
        self.rnn = nn.LSTM(1, 10, num_layers=1, batch_first=True)
        self.fc = nn.Linear(10, 1)

    def forward(self, x):
        h0 = torch.zeros(1, x.size(0), 10).to(x.device)
        c0 = torch.zeros(1, x.size(0), 10).to(x.device)

        out, _ = self.rnn(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return out

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.form['data']
    data = np.array([float(x) for x in data.split(',')])
    model_type = request.form['model_type']

    if model_type == 'nn':
        model = Net()
    elif model_type == 'conv':
        model = ConvNet()
    elif model_type == 'recurrent':
        model = RecurrentNet()

    model.eval()
    with torch.no_grad():
        output = model(torch.tensor(data).float())
        prediction = torch.argmax(output)
        return jsonify({'prediction': prediction.item()})

if __name__ == '__main__':
    app.run(debug=True)
```