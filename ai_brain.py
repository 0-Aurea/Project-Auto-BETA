CONTENT:
```python
import numpy as np
from neural_net import NeuralNetwork
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

    # Train neural network
    trainer.train(0.1, 10000)

    # Evaluate neural network
    error = trainer.evaluate()
    print(f"Error: {error}")

    # Evolve neural network
    new_neural_network = trainer.evolve(2, 3, 1)

    # Create new trainer
    new_trainer = Trainer(new_neural_network, inputs, targets)

    # Train new neural network
    new_trainer.train(0.1, 10000)

    # Evaluate new neural network
    new_error = new_trainer.evaluate()
    print(f"New Error: {new_error}")

if __name__ == "__main__":
    main()
```