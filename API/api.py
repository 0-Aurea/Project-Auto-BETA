import logging
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

def load_data(file_path: str) -> pd.DataFrame:
    """
    Load data from a CSV file.

    Args:
        file_path (str): Path to the CSV file.

    Returns:
        pd.DataFrame: Loaded data.
    """
    try:
        return pd.read_csv(file_path)
    except Exception as e:
        logging.error(f"Failed to load data: {e}")
        return None

def preprocess_data(data: pd.DataFrame) -> tuple:
    """
    Preprocess the data by handling missing values and encoding categorical variables.

    Args:
        data (pd.DataFrame): Data to preprocess.

    Returns:
        tuple: Preprocessed data, feature columns, target column.
    """
    # Separate features and target
    X = data.drop('target', axis=1)  # Assuming 'target' is the target column
    y = data['target']

    # Define preprocessing pipeline for numerical and categorical columns
    numerical_features = X.select_dtypes(include=['int64', 'float64']).columns
    categorical_features = X.select_dtypes(include=['object']).columns

    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())])

    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('onehot', OneHotEncoder(handle_unknown='ignore'))])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features)])

    # Fit and transform data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    preprocessor.fit(X_train)

    return preprocessor.transform(X_train), preprocessor.transform(X_test), y_train, y_test

def main() -> None:
    """
    Main function to run the script.

    Returns:
        None
    """
    try:
        data = load_data('data.csv')  # Replace with your data file
        if data is not None:
            X_train, X_test, y_train, y_test = preprocess_data(data)
            print("Preprocessed data shapes:")
            print(f"X_train: {X_train.shape}, X_test: {X_test.shape}, y_train: {y_train.shape}, y_test: {y_test.shape}")
    except Exception as e:
        logging.error(f"An error occurred: {e}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()