Based on the provided specifications, I will create a Python file named `auto_5.py` for a self-learning AI system. Here is the code:

```python
# auto_5.py

"""
Self-Learning AI System
======================

This file serves as a starting point for a self-learning AI system.
"""

import os
import sys
import logging
from logging.handlers import RotatingFileHandler

# Organize Imports
# -----------------

# Standard Library Imports
import argparse
import json
import pickle

# Third-Party Imports
import numpy as np
import pandas as pd

# Local Imports
from ai_brain import Brain
from artificial.fake import FakeData

# Set Up Logging
# ---------------

# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create a rotating file handler
file_handler = RotatingFileHandler('auto_5.log', maxBytes=1024*1024*10, backupCount=10)
file_handler.setLevel(logging.INFO)

# Create a console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Create a formatter and attach it to the handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add the handlers to the logger
logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Define the SelfLearningAISystem Class
# --------------------------------------

class SelfLearningAISystem:
    def __init__(self):
        self.brain = Brain()
        self.fake_data = FakeData()

    def train(self):
        # Train the AI brain using fake data
        self.brain.train(self.fake_data.generate_data())

    def evaluate(self):
        # Evaluate the performance of the AI brain
        performance = self.brain.evaluate()
        logger.info(f'Performance: {performance}')

    def save_model(self):
        # Save the trained model
        self.brain.save_model('auto_5_model.pkl')

    def load_model(self):
        # Load a saved model
        self.brain.load_model('auto_5_model.pkl')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Self-Learning AI System')
    parser.add_argument('--train', action='store_true', help='Train the AI brain')
    parser.add_argument('--evaluate', action='store_true', help='Evaluate the performance of the AI brain')
    parser.add_argument('--save_model', action='store_true', help='Save the trained model')
    parser.add_argument('--load_model', action='store_true', help='Load a saved model')
    args = parser.parse_args()

    ai_system = SelfLearningAISystem()

    if args.train:
        ai_system.train()
    if args.evaluate:
        ai_system.evaluate()
    if args.save_model:
        ai_system.save_model()
    if args.load_model:
        ai_system.load_model()
```

This code provides a basic structure for a self-learning AI system. It includes:

1.  Organized imports
2.  A `SelfLearningAISystem` class with methods for training, evaluating, saving, and loading the AI model
3.  Logging configuration
4.  Command-line argument parsing using `argparse`

You can extend and modify this code to suit your specific requirements. Make sure to implement the `Brain` and `FakeData` classes in separate files (`ai_brain.py` and `artificial/fake.py`) as referenced in the code.