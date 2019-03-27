from flask import Flask

app = Flask(__name__)
from app import databases
from app import routes

if __name__ == '__main__':
        app.static_folder = 'static'
        app.run(debug=True,host='0.0.0.0')
