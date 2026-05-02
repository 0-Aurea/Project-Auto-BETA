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
    """Handles data preprocessing for machine learning pipelines.
    
    Attributes:
        data_path (str): Path to input dataset
        test_size (float): Proportion of dataset for testing (0.0-1.0)
        random_state (int): Random seed for reproducibility
        numerical_cols (list): Names of numerical columns
        categorical_cols (list): Names of categorical columns
        preprocessor (ColumnTransformer): Configured preprocessing pipeline
        X_train (pd.DataFrame): Preprocessed training features
        X_test (pd.DataFrame): Preprocessed test features
        y_train (pd.Series): Training target values
        y_test (pd.Series): Test target values
    """

    def __init__(self, data_path: str, test_size: float = 0.2, random_state: int = 42):
        """Initialize preprocessor with dataset configuration."""
        self.data_path = data_path
        self.test_size = test_size
        self.random_state = random_state
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)
        self.numerical_cols = None
        self.categorical_cols = None
        self.preprocessor = None

    def load_data(self) -> pd.DataFrame:
        """Load dataset from specified path with error handling."""
        try:
            self.logger.info(f"Loading data from {self.data_path}")
            data = pd.read_csv(self.data_path)
            self.logger.info(f"Data loaded. Shape: {data.shape}")
            return data
        except Exception as e:
            self.logger.error(f"Error loading data: {e}")
            raise

    def split_features_target(self, data: pd.DataFrame, target_col: str) -> Tuple[pd.DataFrame, pd.Series]:
        """Split data into features and target variable.
        
        Args:
            data: Input DataFrame
            target_col: Name of target column
            
        Returns:
            Tuple of (features, target)
        """
        self.logger.info(f"Splitting data into features and target using column: {target_col}")
        if target_col not in data.columns:
            raise ValueError(f"Target column '{target_col}' not found in dataset")
            
        X = data.drop(columns=[target_col])
        y = data[target_col]
        self.logger.info(f"Features shape: {X.shape}, Target shape: {y.shape}")
        return X, y

    def identify_columns(self, X: pd.DataFrame):
        """Identify numerical and categorical columns."""
        self.numerical_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
        
        if not self.numerical_cols and not self.categorical_cols:
            raise ValueError("No numerical or categorical columns found in dataset")
            
        self.logger.info(f"Numerical columns: {self.numerical_cols}")
        self.logger.info(f"Categorical columns: {self.categorical_cols}")

    def create_preprocessor(self) -> ColumnTransformer:
        """Create preprocessing pipeline for numerical and categorical features."""
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
                ('num', numerical_pipeline, self.numerical_cols),
                ('cat', categorical_pipeline, self.categorical_cols)
            ],
            remainder='drop'
        )
        self.logger.info("Preprocessing pipeline created.")
        return self.preprocessor

    def split_data(self, X: pd.DataFrame, y: pd.Series):
        """Split data into training and test sets."""
        self.logger.info(f"Splitting data with test size {self.test_size}")
        self.X_train, self.X_test, self.y_train, self.y_test = train_test_split(
            X, y, test_size=self.test_size, random_state=self.random_state
        )
        self.logger.info(f"Train set shape: {self.X_train.shape}, Test set shape: {self.X_test.shape}")

    def fit(self, data: pd.DataFrame, target_col: str):
        """Fit preprocessing pipeline on dataset.
        
        Args:
            data: Input DataFrame
            target_col: Name of target column
        """
        X, y = self.split_features_target(data, target_col)
        self.identify_columns(X)
        self.split_data(X, y)
        self.create_preprocessor()
        self.preprocessor.fit(self.X_train)
        self.logger.info("Preprocessor fitted on training data.")

    def transform(self, data: pd.DataFrame) -> np.ndarray:
        """Transform data using fitted preprocessor.
        
        Args:
            data: Input DataFrame to transform
            
        Returns:
            Transformed numpy array
        """
        if self.preprocessor is None:
            raise ValueError("Preprocessor not fitted. Call fit() first.")
            
        self.logger.info(f"Transforming data with shape {data.shape}")
        return self.preprocessor.transform(data)

    def fit_transform(self, target_col: str) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Execute complete preprocessing workflow.
        
        Args:
            target_col: Name of target column
            
        Returns:
            Tuple of (X_train, X_test, y_train, y_test)
        """
        data = self.load_data()
        self.fit(data, target_col)
        
        X_train_trans = self.preprocessor.transform(self.X_train)
        X_test_trans = self.preprocessor.transform(self.X_test)
        
        self.logger.info("Preprocessing complete")
        return X_train_trans, X_test_trans, self.y_train, self.y_test