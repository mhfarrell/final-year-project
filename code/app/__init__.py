from flask import Flask

app = Flask(__name__)
print("run db")
from app import database
print("run routes")
from app import routes
