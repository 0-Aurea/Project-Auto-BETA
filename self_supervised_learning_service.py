```python
import numpy as np
import sqlite3
from bs4 import BeautifulSoup
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from neural_net import NeuralNetwork

class SelfSupervisedLearningService:
    def __init__(self, db_name):
        self.db_name = db_name
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''CREATE TABLE IF NOT EXISTS training_examples
                             (id INTEGER PRIMARY KEY, inputs TEXT, targets TEXT)''')
        self.conn.commit()

    def create_neural_network(self, input_size, hidden_size, output_size):
        return NeuralNetwork(input_size, hidden_size, output_size)

    def store_training_example(self, inputs, targets):
        self.cursor.execute('''
            INSERT INTO training_examples (inputs, targets)
            VALUES (?, ?)
        ''', (str(inputs.tolist()), str(targets.tolist())))
        self.conn.commit()

    def get_training_examples(self):
        self.cursor.execute('SELECT * FROM training_examples')
        return self.cursor.fetchall()

    def web_scrape(self, url):
        try:
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')
            return soup.get_text()
        except Exception as e:
            print(f"Error web scraping: {e}")
            return ""

    def generate_data(self, url):
        text = self.web_scrape(url)
        inputs = np.array([ord(char) for char in text])
        targets = np.array([ord(char) for char in text[1:]])
        return inputs.reshape(-1, 1), targets.reshape(-1, 1)

    def self_supervised_learning(self):
        url = "http://example.com"
        inputs, targets = self.generate_data(url)
        neural_network = self.create_neural_network(1, 10, 1)

        for _ in range(1000):
            hidden_layer = np.tanh(np.dot(inputs, neural_network.weights1) + neural_network.bias1)
            outputs = np.tanh(np.dot(hidden_layer, neural_network.weights2) + neural_network.bias2)

            output_error = targets - outputs
            neural_network.weights2 += 0.1 * np.dot(hidden_layer.T, output_error)
            neural_network.bias2 += 0.1 * np.sum(output_error, axis=0, keepdims=True)

            hidden_error = np.dot(output_error, neural_network.weights2.T) * (1 - np.tanh(hidden_layer) ** 2)
            neural_network.weights1 += 0.1 * np.dot(inputs.T, hidden_error)
            neural_network.bias1 += 0.1 * np.sum(hidden_error, axis=0, keepdims=True)

        self.store_training_example(inputs, outputs)

if __name__ == "__main__":
    service = SelfSupervisedLearningService("self_supervised_learning.db")
    service.self_supervised_learning()
```