import os
import logging
import psycopg2
from psycopg2 import Error
from typing import List, Any, Tuple, Optional

from .config import DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_PORT

logging.basicConfig(level=logging.INFO)


def get_connection() -> psycopg2.extensions.connection:
    """Establish and return a PostgreSQL database connection using environment variables.

    Returns:
        psycopg2.extensions.connection: Active database connection object

    Raises:
        psycopg2.Error: If connection parameters are invalid or database is unreachable
    """
    try:
        connection = psycopg2.connect(
            host=DATABASE_HOST,
            database=DATABASE_NAME,
            user=DATABASE_USER,
            password=DATABASE_PASSWORD,
            port=DATABASE_PORT
        )
        logging.info("Successfully connected to database: %s@%s/%s", 
                      DATABASE_USER, DATABASE_HOST, DATABASE_NAME)
        return connection
    except Error as e:
        logging.error("Database connection failed: %s", e, exc_info=True)
        raise