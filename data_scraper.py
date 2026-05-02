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
from model_tracker import ModelTracker

class DataScraper:
    def __init__(self, db_name):
        self.db_name = db_name
        self.conn = sqlite3.connect(db_name)
        self.cursor = self.conn.cursor()
        self.model_tracker = ModelTracker(db_name)
        self.neural_network = NeuralNetwork(784, 128, 10)

    def scrape_data(self, url):
        try:
            options = webdriver.ChromeOptions()
            options.add_argument('headless')
            driver = webdriver.Chrome(options=options)
            driver.get(url)
            html = driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            inputs = []
            targets = []
            for row in soup.find_all('div', class_='data-row'):
                input_data = np.array([float(x) for x in row.find('span', class_='input').text.split(',')])
                target_data = np.array([float(x) for x in row.find('span', class_='target').text.split(',')])
                inputs.append(input_data)
                targets.append(target_data)
            driver.quit()
            return np.array(inputs), np.array(targets)
        except TimeoutException:
            return np.array([]), np.array([])

    def store_data(self, inputs, targets):
        for i in range(len(inputs)):
            self.model_tracker.store_training_example(inputs[i], targets[i])

    def train_neural_network(self):
        self.cursor.execute('SELECT input, target FROM training_examples')
        rows = self.cursor.fetchall()
        inputs = []
        targets = []
        for row in rows:
            inputs.append(np.array(eval(row[0])))
            targets.append(np.array(eval(row[1])))
        inputs = np.array(inputs)
        targets = np.array(targets)
        self.neural_network.train(inputs, targets, 0.1, 1000)

    def evaluate_neural_network(self):
        self.cursor.execute('SELECT input, target FROM training_examples')
        rows = self.cursor.fetchall()
        inputs = []
        targets = []
        for row in rows:
            inputs.append(np.array(eval(row[0])))
            targets.append(np.array(eval(row[1])))
        inputs = np.array(inputs)
        targets = np.array(targets)
        return self.neural_network.evaluate(inputs, targets)

def main():
    data_scraper = DataScraper('data.db')
    url = 'http://example.com/data'
    inputs, targets = data_scraper.scrape_data(url)
    data_scraper.store_data(inputs, targets)
    data_scraper.train_neural_network()
    accuracy = data_scraper.evaluate_neural_network()
    print(f'Accuracy: {accuracy:.2f}')

if __name__ == '__main__':
    main()
```