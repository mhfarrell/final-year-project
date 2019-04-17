import os
from threading import Lock
from flask import Flask, render_template, request, redirect, url_for, session
from app import app
import bcrypt
import sys, getopt, pprint
import pymongo
from pymongo import MongoClient
from flask_socketio import SocketIO, emit, join_room, leave_room, \
    close_room, rooms, disconnect

async_mode = None
c = MongoClient('mongodb://admin:Admin123@ds145555.mlab.com:45555/chatdatabase')
db= c.chatdatabase
#make this a hashed version of something unique to the user
app.secret_key = 'shush_its_secret'
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock()

def loadContact():
    myQuery = { '$or': [ { 'recipient': session['username'] }, { 'sender': session['username'] } ] }
    cursor = db.chat.distinct('chatID', myQuery)
    
    chats = []
    for doc in cursor:
        cursor2 = db.chat.find({"chatID" : doc}, limit = 1).sort([('date',  pymongo.ASCENDING), ('time', pymongo.ASCENDING)])
        chats.append(cursor2)
    return chats


def loadChat():
    myQuery = {}
    return myQuery


@socketio.on('connect', namespace='/test')
def test_connect():
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_thread)
    emit('my_response', {'data': 'Connected', 'count': 0})


@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected', request.sid)

def background_thread():
    """Example of how to send server generated events to clients."""
    count = 0
    while True:
        socketio.sleep(10)
        count += 1
        socketio.emit('my_response',
                      {'data': 'Server generated event', 'count': count},
                      namespace='/test')

@app.route('/')
@app.route('/index')
def index():
    if 'username' in session:
        print(session['username'])
        return render_template('index.html',\
                               current_user=session['username'],\
                               chats=loadContact())

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
                print(session['username'])
                return render_template('index.html',\
                                       current_user=session['username'],\
                                       chats=loadContact())

    return render_template('login.html', \
                           Form='login-form', \
                           altForm='register-form', \
                           loginMessage='Invalid Password/Username')

@app.route('/logout')
def logout():
    print(session['username'])
    print("here here")
    session.pop('username')
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
            return render_template('index.html',\
                                   current_user=session['username'],\
                                   chats=loadContact())
        
    return render_template('login.html', \
                           altForm='login-form', \
                           Form='register-form', \
                           registerMessage='Sorry that username already exists')


@socketio.on('join', namespace='/test')
def join(message):
    join_room(message['room'])
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Joined Room: ' + ', '.join(rooms()),
          'count': session['receive_count']})
    myQuery = {'chatID' : message['room']}
    cursor = db.chat.find(myQuery)
    for doc in cursor:
        emit('my_response',
             {'data': doc['data'], 'username': doc['sender'], 'count': session['receive_count']},
             room=message['room'])          

@socketio.on('leave', namespace='/test')
def leave(message):
    leave_room(message['room'])
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Left Room: ' + ', '.join(rooms()),
          'count': session['receive_count']})


@socketio.on('sendMessage', namespace='/test')
def send_room_message(message):
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': message['data'], 'username': message['username'], 'count': session['receive_count']},
         room=message['room'])


@socketio.on('disconnect_request', namespace='/test')
def disconnect_request():
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Disconnected!', 'count': session['receive_count']})
    disconnect()
