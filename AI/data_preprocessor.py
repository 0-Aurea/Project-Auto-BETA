import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
import logging
import os

class DataPreprocessor:
    def __init__(self, data_path, test_size=0.2, random_state=42):
        self.data_path = data_path
        self.test_size = test_size
        self.random_state = random_state
        self.data = None
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None
        self.preprocessor = None

    def load_data(self):
        if not os.path.exists(self.data_path):
            logging.error(f"File not found: {self.data_path}")
            raise FileNotFoundError(f"Data file not found at {self.data_path}")
        self.data = pd.read_csv(self.data_path)
        logging.info(f"Loaded data with shape {self.data.shape}")
        return self.data

    def process_data(self, target_col='target', categorical_cols=None):
        self.load_data()
        X = self.data.drop(target_col, axis=1)
        y = self.data[target_col]
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=self.test_size, random_state=self.random_state
        )
        
        if categorical_cols is None:
            categorical_cols = X_train.select_dtypes(include=['object']).columns.tolist()
        numerical_cols = [col for col in X_train.columns if col not in categorical_cols]

        numerical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='mean')),
            ('scaler', StandardScaler())
        ])

        categorical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('encoder', OneHotEncoder(handle_unknown='ignore'))
        ])

        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numerical_pipeline, numerical_cols),
                ('cat', categorical_pipeline, categorical_cols)
            ]
        )

        X_train = self.preprocessor.fit_transform(X_train)
        X_test = self.preprocessor.transform(X_test)

        self.X_train, self.X_test, self.y_train, self.y_test = X_train, X_test, y_train, y_test
        return self.X_train, self.X_test, self.y_train, self.y_test

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    preprocessor = DataPreprocessor(data_path='data.csv')
    X_train, X_test, y_train, y_test = preprocessor.process_data()
    print(f"Train features shape: {X_train.shape}")
    print(f"Test features shape: {X_test.shape}")