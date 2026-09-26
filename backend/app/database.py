from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib.parse
import pymysql

import os

# MySQL Connection Details
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Vani@#2005")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "scholarship_db")

# Create database if not exists
try:
    # Connect without specifying database name first
    connection = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=int(DB_PORT)
    )
    with connection.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
    connection.close()
except Exception as e:
    print(f"Warning: Could not auto-create database '{DB_NAME}'. Error: {e}")

# URL-encode the password to safely handle special characters like '@'
safe_password = urllib.parse.quote_plus(DB_PASSWORD)

# MySQL Connection URL
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{safe_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

# Create SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
