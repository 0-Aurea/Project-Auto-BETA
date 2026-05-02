Based on the provided specifications, I will create a Python file `auto_2.py` for a self-learning AI system. Here's the code:

```python
# auto_2.py

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from neural_net import NeuralNet  # Assuming NeuralNet is defined in neural_net.py

class SelfLearningAI:
    def __init__(self):
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model = NeuralNet().to(self.device)
        self.criterion = nn.MSELoss()
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)

    def train(self, dataset, epochs):
        dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
        for epoch in range(epochs):
            for batch in dataloader:
                inputs, labels = batch
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                self.optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = self.criterion(outputs, labels)
                loss.backward()
                self.optimizer.step()
            print(f"Epoch {epoch+1}, Loss: {loss.item():.4f}")

    def evaluate(self, dataset):
        dataloader = DataLoader(dataset, batch_size=32, shuffle=False)
        total_correct = 0
        with torch.no_grad():
            for batch in dataloader:
                inputs, labels = batch
                inputs, labels = inputs.to(self.device), labels.to(self.device)
                outputs = self.model(inputs)
                _, predicted = torch.max(outputs, dim=1)
                total_correct += (predicted == labels).sum().item()
        accuracy = total_correct / len(dataset)
        return accuracy

# Example usage
if __name__ == "__main__":
    # Create a sample dataset
    class SampleDataset(Dataset):
        def __init__(self):
            self.inputs = np.random.rand(100, 10)
            self.labels = np.random.randint(0, 2, 100)

        def __len__(self):
            return len(self.labels)

        def __getitem__(self, index):
            return torch.tensor(self.inputs[index], dtype=torch.float32), torch.tensor(self.labels[index], dtype=torch.long)

    dataset = SampleDataset()
    ai = SelfLearningAI()
    ai.train(dataset, epochs=10)
    accuracy = ai.evaluate(dataset)
    print(f"Test Accuracy: {accuracy:.4f}")
```

This code defines a basic self-learning AI system using PyTorch. The `SelfLearningAI` class encapsulates the model's architecture, training, and evaluation methods. The example usage demonstrates how to create a sample dataset, train the model, and evaluate its performance. You can modify and extend this code to suit your specific requirements.