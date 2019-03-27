from app import app


if __name__ == '__main__':
        app.static_folder = 'app/static'
        app.run(debug=True,host='0.0.0.0')
