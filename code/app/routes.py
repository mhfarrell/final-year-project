import os
from flask import Flask, render_template, request, redirect, url_for, session
from app import app
import bcrypt
import sys, getopt, pprint
from pymongo import MongoClient
from flask_socketio import SocketIO, emit

c = MongoClient('mongodb://admin:Admin123@ds145555.mlab.com:45555/chatdatabase')
db= c.chatdatabase
#make this a hashed version of something unique to the user
app.secret_key = 'shush_its_secret'

@app.route('/')
@app.route('/index')
def index():
    if 'username' in session:
        return render_template('index.html')
    
    return render_template('login.html', \
                           Form='login-form', \
                           altForm='register-form')

@app.route('/login', methods=['POST'])
def login():
    users = db.users
    loginUser = users.find_one({'username' : request.form['username']})
    print(request.form['username'])
    if loginUser:
        hashPass = bcrypt.hashpw(request.form['password'].encode('utf-8'), loginUser['password'])
        if loginUser:
            if hashPass == loginUser['password']:
                session['username'] = request.form['username']
                return render_template('index.html')
    return render_template('login.html', \
                           Form='login-form', \
                           altForm='register-form', \
                           loginMessage='Invalid Password/Username')

@app.route('/logout')
def logout():
    session['username'] = ''
    return render_template('login.html', \
                           Form='login-form', \
                           altForm='register-form', \
                           loginMessage='You have been logged out!')

@app.route('/register', methods=['POST', 'GET'])
def register():
    if request.method == 'POST':
        users = db.users
        #userCheck is checking database if the username from the new user exists already
        userCheck = users.find_one({'username' : request.form['username']})
        #If the username is unclaimed the new user can register
        if userCheck is None:
            hashPass = bcrypt.hashpw(request.form['password'].encode('utf-8'), bcrypt.gensalt())
            users.insert({'username' : request.form['username'], 'password' : hashPass, 'firstName' : request.form['firstname'], 'surname' : request.form['surname'], 'email' : request.form['email'], 'company' : request.form['company']})
            session['username'] = request.form['username']
            return render_template('index.html')
        
    return render_template('login.html', \
                           altForm='login-form', \
                           Form='register-form', \
                           registerMessage='Sorry that username already exists')

@socketio.on('my event', namespace='/test')
def test_message(message):
    emit('my response', {'data': message['data']})

@socketio.on('my broadcast event', namespace='/test')
def test_message(message):
    emit('my response', {'data': message['data']}, broadcast=True)

@socketio.on('connect', namespace='/test')
def test_connect():
    emit('my response', {'data': 'Connected'})

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')
