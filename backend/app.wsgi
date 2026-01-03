"""
WSGI config for GreenVested API.

It exposes the WSGI callable as a module-level variable named ``app``.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app as application

if __name__ == "__main__":
    application()
