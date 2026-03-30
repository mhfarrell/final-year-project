# Flask Chat - Final Year Project

## Overview
Real-time chat application built with Flask, Flask-SocketIO, and MongoDB.

## Stack
- **Backend**: Python / Flask / Flask-SocketIO
- **Database**: MongoDB (local via Docker)
- **Frontend**: jQuery, Socket.IO client, Bootstrap 3, custom CSS
- **Auth**: bcrypt password hashing

## Running Locally
```bash
docker compose up --build
```
App runs on http://localhost:5000, MongoDB on localhost:27017.

## Seed Data
The `code/chat.py` script seeds the MongoDB with test data from `code/resources/chat.csv`.
It runs automatically on app startup if the database is empty.

## Project Structure
- `code/app/routes.py` - All Flask routes and Socket.IO event handlers
- `code/app/__init__.py` - Flask app factory
- `code/app/templates/` - Jinja2 templates (index.html, login.html, 404.htm)
- `code/app/static/` - CSS, JS, images
- `code/chat.py` - Entry point / DB seeder
- `docker-compose.yml` - Local dev environment (MongoDB + app)
