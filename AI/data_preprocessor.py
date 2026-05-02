import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
import logging
from typing import Tuple, Union

class DataPreprocessor:
    """
    Handles data preprocessing for machine learning pipelines.

    Attributes:
        data_path (str): Path to input dataset
    """

    def __init__(self, data_path: str):
        """
        Initializes the DataPreprocessor with a data path.

        Args:
            data_path (str): Path to the input dataset
        """
        self.data_path = data_path

    def load_data(self) -> pd.DataFrame:
        """
        Loads the data from the specified path.

        Returns:
            pd.DataFrame: Loaded data
        """
        try:
            data = pd.read_csv(self.data_path)
            return data
        except Exception as e:
            logging.error(f"Failed to load data: {e}")
            return None

    def split_data(self, data: pd.DataFrame, test_size: float = 0.2, random_state: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Splits the data into training and testing sets.

        Args:
            data (pd.DataFrame): Input data
            test_size (float, optional): Proportion of data for testing. Defaults to 0.2.
            random_state (int, optional): Random seed for reproducibility. Defaults to 42.

        Returns:
            Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]: Training features, testing features, training target, testing target
        """
        X = data.drop('target', axis=1)  # Assuming 'target' is the target column
        y = data['target']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=random_state)
        return X_train, X_test, y_train, y_test

    def create_preprocessing_pipeline(self, numeric_features: list, categorical_features: list) -> Pipeline:
        """
        Creates a preprocessing pipeline for numeric and categorical features.

        Args:
            numeric_features (list): List of numeric feature names
            categorical_features (list): List of categorical feature names

        Returns:
            Pipeline: Preprocessing pipeline
        """
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)])

        return preprocessor

    def preprocess_data(self, X_train: pd.DataFrame, X_test: pd.DataFrame, numeric_features: list, categorical_features: list) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Preprocesses the training and testing data.

        Args:
            X_train (pd.DataFrame): Training features
            X_test (pd.DataFrame): Testing features
            numeric_features (list): List of numeric feature names
            categorical_features (list): List of categorical feature names

        Returns:
            Tuple[pd.DataFrame, pd.DataFrame]: Preprocessed training features, preprocessed testing features
        """
        preprocessing_pipeline = self.create_preprocessing_pipeline(numeric_features, categorical_features)
        X_train_preprocessed = preprocessing_pipeline.fit_transform(X_train)
        X_test_preprocessed = preprocessing_pipeline.transform(X_test)
        return X_train_preprocessed, X_test_preprocessed