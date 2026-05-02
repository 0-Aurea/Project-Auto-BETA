CONTENT:
```python
import numpy as np
from neural_net import NeuralNetwork, ConvolutionalNeuralNetwork, RecurrentNeuralNetwork, Transformer, Autoencoder
from trainer import Trainer

def main():
    np.random.seed(0)

    # Initialize neural network
    neural_network = NeuralNetwork(2, 2, 1)

    # Create training data
    inputs = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
    targets = np.array([[0], [1], [1], [0]])

    # Create trainer
    trainer = Trainer(neural_network, inputs, targets)

    # Train
    trainer.train(0.1, 1000)

if __name__ == "__main__":
    main()
```