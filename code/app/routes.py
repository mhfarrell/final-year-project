import os
from flask import Flask, render_template, request, redirect, url_for, jsonify
from app import app
import requests
import json
import sys, getopt, pprint
from pymongo import MongoClient

@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')
