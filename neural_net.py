import numpy as np
from typing import Tuple, List, Dict, Any, Optional


class NeuralNetwork:
    """A simple feedforward neural network with one hidden layer.
    
    Attributes:
        input_size: Number of input features
        hidden_size: Number of neurons in hidden layer
        output_size: Number of output classes
        weights_input_hidden: Input-to-hidden layer weights (shape: [hidden_size, input_size])
        weights_hidden_output: Hidden-to-output layer weights (shape: [output_size, hidden_size])
        bias_hidden: Hidden layer bias (shape: [hidden_size, 1])
        bias_output: Output layer bias (shape: [output_size, 1])
    """

    def __init__(self, input_size: int, hidden_size: int, output_size: int):
        """Initialize network with given layer dimensions using He initialization."""
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        
        # He initialization for weights
        self.weights_input_hidden = np.random.randn(hidden_size, input_size) * np.sqrt(2./input_size)
        self.weights_hidden_output = np.random.randn(output_size, hidden_size) * np.sqrt(2./hidden_size)
        
        # Biases initialized to zero
        self.bias_hidden = np.zeros((hidden_size, 1))
        self.bias_output = np.zeros((output_size, 1))

    def forward(self, X: np.ndarray) -> np.ndarray:
        """Compute forward pass through the network.
        
        Args:
            X: Input data with shape [input_size, batch_size]
            
        Returns:
            Output probabilities with shape [output_size, batch_size]
        """
        # Hidden layer computation
        hidden_input = self.weights_input_hidden @ X + self.bias_hidden
        hidden_output = np.tanh(hidden_input)
        
        # Output layer computation
        output_input = self.weights_hidden_output @ hidden_output + self.bias_output
        output = self._softmax(output_input)
        return output

    def _softmax(self, X: np.ndarray) -> np.ndarray:
        """Compute softmax activation function."""
        exp_values = np.exp(X - np.max(X, axis=0, keepdims=True))
        return exp_values / np.sum(exp_values, axis=0, keepdims=True)