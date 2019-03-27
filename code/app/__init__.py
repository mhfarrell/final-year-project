from flask import Flask

app = Flask(__name__)
print("run db")
from app import database
print("run routes")
from app import routes

if __name__ == '__main__':
        app.static_folder = 'app/static'
        app.run(debug=True,host='0.0.0.0')
