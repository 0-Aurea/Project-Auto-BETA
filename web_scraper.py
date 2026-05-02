```python
import numpy as np
import sqlite3
from bs4 import BeautifulSoup
import requests
import random

class WebScraper:
    def __init__(self, db_name):
        self.db_name = db_name
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''CREATE TABLE IF NOT EXISTS data
                             (input text, target text)''')
        self.conn.commit()

    def scrape(self, url):
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        inputs = []
        targets = []
        for paragraph in soup.find_all('p'):
            text = paragraph.get_text()
            inputs.append(text)
            targets.append(len(text))
        return inputs, targets

    def store_data(self, inputs, targets):
        for input, target in zip(inputs, targets):
            self.cursor.execute("INSERT INTO data VALUES (?, ?)", (input, target))
        self.conn.commit()

    def generate_data(self, num_samples):
        urls = ["http://example.com"] * num_samples
        for url in urls:
            inputs, targets = self.scrape(url)
            self.store_data(inputs, targets)

    def self_supervised_learning(self):
        self.cursor.execute("SELECT * FROM data")
        rows = self.cursor.fetchall()
        inputs = [row[0] for row in rows]
        targets = [row[1] for row in rows]

        # Simple neural network for self-supervised learning
        class NeuralNetwork:
            def __init__(self, input_size, hidden_size, output_size):
                self.weights1 = np.random.rand(input_size, hidden_size)
                self.weights2 = np.random.rand(hidden_size, output_size)
                self.bias1 = np.zeros((1, hidden_size))
                self.bias2 = np.zeros((1, output_size))

            def forward(self, inputs):
                hidden_layer = np.tanh(np.dot(inputs, self.weights1) + self.bias1)
                outputs = np.tanh(np.dot(hidden_layer, self.weights2) + self.bias2)
                return outputs

        neural_network = NeuralNetwork(784, 256, 1)
        inputs = np.array([list(map(ord, input)) for input in inputs])
        targets = np.array(targets).reshape(-1, 1)

        for _ in range(1000):
            hidden_layer = np.tanh(np.dot(inputs, neural_network.weights1) + neural_network.bias1)
            outputs = np.tanh(np.dot(hidden_layer, neural_network.weights2) + neural_network.bias2)

            output_error = targets - outputs
            hidden_error = np.dot(output_error, neural_network.weights2.T)

            neural_network.weights2 += 0.1 * np.dot(hidden_layer.T, output_error)
            neural_network.weights1 += 0.1 * np.dot(inputs.T, hidden_error)

            neural_network.bias2 += 0.1 * np.sum(output_error, axis=0, keepdims=True)
            neural_network.bias1 += 0.1 * np.sum(hidden_error, axis=0, keepdims=True)

if __name__ == "__main__":
    web_scraper = WebScraper('data.db')
    web_scraper.generate_data(100)
    web_scraper.self_supervised_learning()
```