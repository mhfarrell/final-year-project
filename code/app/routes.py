import os
import re
import sys, time, bcrypt, pymongo
from functools import wraps
from threading import Lock
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from app import app
from pymongo import MongoClient
from flask_socketio import SocketIO, emit, join_room, leave_room, \
    close_room, rooms, disconnect
from html_sanitizer import Sanitizer

async_mode = None
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://admin:Admin123@localhost:27017/chatdatabase?authSource=admin')
c = MongoClient(mongo_uri)
db = c.chatdatabase
app.secret_key = os.environ.get('SECRET_KEY', os.urandom(32))
socketio = SocketIO(app, async_mode=async_mode)
thread = None
thread_lock = Lock()
sanitizer = Sanitizer()

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated

def loadChat():
    myQuery = { '$or': [ { 'recipient': session['username'] }, { 'sender': session['username'] } ] }
    chatIDs = db.chat.distinct('chatID', myQuery)
    chats = []
    for chatID in chatIDs:
        doc = db.chat.find_one({"chatID" : chatID}, sort=[('msgID', pymongo.DESCENDING)])
        if doc:
            chats.append(doc)
    return chats

def createChat(username):
    print("createContact")
    myQuery = { '$or': [
        { 'recipient': username, 'sender': session['username'] },
        { 'sender': username, 'recipient': session['username'] }
    ]}
    if db.chat.distinct('chatID', myQuery):
        print("found chat with " + username + " already")
        return
    else:
        print("not found " + username + " in db")
        msgID = "msg" + str(db.chat.count_documents({}) + 1)
        print("msgid: " + msgID)
        cursor = db.chat.find().sort([('chatID',  pymongo.DESCENDING)]).limit(1)
        chtID = "1"
        for doc in cursor:
            print(doc['chatID'])
            chtID = str(int(doc['chatID']) + 1)
            print(chtID)
        myDict = {"msgID": msgID , "chatID" : chtID, "recipient" : username, "sender": session['username'], "datetime": int(time.time()) , "data": "Hi"}
        db.chat.insert_one(myDict)
        return {'chatID' : chtID, 'sender' : session['username']}


def loadContact(search):
    print('search text is: ' + search)
    # Escape regex special characters to prevent ReDoS / regex injection
    safe_search = re.escape(search)
    myQuery = {'username' : {'$ne' : session['username']},
           '$and' : [{'$or' : [
                 {'username' : {'$regex' : safe_search, '$options': 'i'}},
                 {'surname' : {'$regex' : safe_search, '$options': 'i'}},
                 {'firstName' : {'$regex' : safe_search, '$options': 'i'}},
                 {'email' : {'$regex' : safe_search, '$options': 'i'}},
                 {'company' : {'$regex' : safe_search, '$options': 'i'}}]}]}
    cursor = db.users.find(myQuery)
    payload = []
    for doc in cursor:
        content = {'username' : doc['username']}
        payload.append(content)

    return payload


@socketio.on('connect', namespace='/')
def Socketconnect():
    global thread
    with thread_lock:
        if thread is None:
            thread = socketio.start_background_task(background_thread)
    emit('my_response', {'data': 'Connected', 'count': 0})


@socketio.on('disconnect', namespace='/')
def Socketdisconnect():
    print('Client disconnected', request.sid)

def background_thread():
    """Example of how to send server generated events to clients."""
    count = 0
    while True:
        socketio.sleep(10)
        count += 1
        socketio.emit('my_response',
                      {'data': 'Server generated event', 'count': count},
                      namespace='/')

@app.route('/')
@app.route('/index')
def index():
    if 'username' in session:
        return render_template('index.html',\
                               current_user=session['username'],\
                               chats=loadChat())

    return render_template('login.html', \
                           Form='login-form', \
                           altForm='register-form')

@app.route('/search', methods=['POST'])
@login_required
def search():
    name = request.form.get('name', '')
    search = request.form.get('search', '')
    if name and search:
        return jsonify(loadContact(search))

    return jsonify({'error' : 'Missing data!'})

@app.route('/newchat', methods=['POST'])
@login_required
def newchat():
    username = request.form.get('username', '')
    if username:
        print("the username is: " + username)
        cChat = jsonify(createChat(username))
        if cChat:
            return cChat

    return jsonify({'error' : 'Missing data!'})

@app.route('/login', methods=['POST'])
def login():
    users = db.users
    loginUser = users.find_one({'username' : request.form['username']})
    if loginUser:
        hashPass = bcrypt.hashpw(request.form['password'].encode('utf-8'), loginUser['password'])
        if hashPass == loginUser['password']:
            session['username'] = request.form['username']
            return render_template('index.html',\
                                   current_user=session['username'],\
                                   chats=loadChat())

    return render_template('login.html', \
                           Form='login-form', \
                           altForm='register-form', \
                           loginMessage='Invalid Password/Username')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return render_template('login.html', \
                           Form='login-form', \
                           altForm='register-form', \
                           loginMessage='You have been logged out!')

@app.route('/register', methods=['POST'])
def register():
    users = db.users
    username = request.form.get('username', '').strip()
    password = request.form.get('password', '')

    if not username or not password:
        return render_template('login.html', \
                               altForm='login-form', \
                               Form='register-form', \
                               registerMessage='Username and password are required')

    userCheck = users.find_one({'username' : username})
    if userCheck is None:
        hashPass = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        users.insert_one({
            'username' : username,
            'password' : hashPass,
            'firstName' : request.form.get('firstname', ''),
            'surname' : request.form.get('surname', ''),
            'email' : request.form.get('email', ''),
            'company' : request.form.get('company', '')
        })
        session['username'] = username
        return render_template('index.html',\
                               current_user=session['username'],\
                               chats=loadChat())

    return render_template('login.html', \
                           altForm='login-form', \
                           Form='register-form', \
                           registerMessage='Sorry that username already exists')



#Socket.io

@socketio.on('join', namespace='/')
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
             {'data': doc['data'], 'username': doc['sender'], 'datetime':doc['datetime'],'count': session['receive_count']},
             room=message['room'])

@socketio.on('leave', namespace='/')
def leave(message):
    leave_room(message['room'])
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Left Room: ' + ', '.join(rooms()),
          'count': session['receive_count']})

@socketio.on('sendMessage', namespace='/')
def sendMessage(message):
    # Use server-side session username, not client-supplied sender
    if 'username' not in session:
        return
    sender = session['username']
    session['receive_count'] = session.get('receive_count', 0) + 1
    newID = "msg" + str(db.chat.count_documents({}) + 1)
    sanatiseMsg = sanitizer.sanitize(message['data'])
    if sanatiseMsg != "":
        myDict = {"msgID": newID , "chatID" : message['room'], "recipient" : message['recipient'], "sender": sender, "datetime": int(time.time()) , "data": sanatiseMsg}
        db.chat.insert_one(myDict)
        emit('my_response',
             {'data': sanatiseMsg, 'username': sender, 'count': session['receive_count']},
             room=message['room'])


@socketio.on('disconnect_request', namespace='/')
def disconnect_request():
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Disconnected!', 'count': session['receive_count']})
    disconnect()
