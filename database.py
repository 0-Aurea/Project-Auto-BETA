import os
import logging
import psycopg2
from psycopg2 import Error
from typing import List, Any, Tuple, Optional

from .config import DATABASE_HOST, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_PORT

logging.basicConfig(level=logging.INFO)


def get_connection() -> psycopg2.extensions.connection:
    """Establish and return a database connection using configuration variables."""
    try:
        connection = psycopg2.connect(
            host=DATABASE_HOST,
            database=DATABASE_NAME,
            user=DATABASE_USER,
            password=DATABASE_PASSWORD,
            port=DATABASE_PORT,
            connect_timeout=10
        )
        connection.autocommit = False
        return connection
    except Error as e:
        logging.critical("Failed to establish database connection: %s", e)
        raise


def execute_query(query: str, params: Tuple = None) -> List[Tuple]:
    """Execute a SELECT query and return results.
    
    Args:
        query: SQL query string with optional parameter placeholders
        params: Tuple of query parameters
        
    Returns:
        List of tuples containing query results
    """
    connection = None
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchall()
            return result
    except Error as e:
        logging.error("Query execution failed: %s", e)
        raise
    finally:
        if connection:
            connection.close()


def execute_command(query: str, params: Tuple = None) -> None:
    """Execute an INSERT/UPDATE/DELETE command and commit changes.
    
    Args:
        query: SQL command string with optional parameter placeholders
        params: Tuple of query parameters
    """
    connection = None
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            connection.commit()
    except Error as e:
        logging.error("Command execution failed: %s", e)
        if connection:
            connection.rollback()
        raise
    finally:
        if connection:
            connection.close()


def query_builder(table: str, filters: dict = None) -> str:
    """Construct a parameterized SELECT query with optional filters.
    
    Args:
        table: Database table name
        filters: Dictionary of column-value pairs for WHERE clause
        
    Returns:
        Tuple of (query string, parameters tuple)
    """
    base_query = f"SELECT * FROM {table}"
    if not filters:
        return f"{base_query};", None
    
    conditions = []
    params = []
    for col, val in filters.items():
        conditions.append(f"{col} = %s")
        params.append(val)
    
    query = f"{base_query} WHERE {' AND '.join(conditions)};"
    return query, tuple(params)