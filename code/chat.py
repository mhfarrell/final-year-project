import os
import csv
import json
import sys
from pymongo import MongoClient

#CSV to JSON Conversion
csvfile = open(os.path.join(sys.path[0], "resources/chat.csv"), "r")
reader = csv.DictReader( csvfile )
print("Loaded CSV")
mongo_uri = os.environ.get('MONGO_URI', 'mongodb://admin:Admin123@localhost:27017/chatdatabase?authSource=admin')
c = MongoClient(mongo_uri)
db = c.chatdatabase
print("Loaded DB")

def popDB():
    db.chat.drop()
    header = [ "msgID", "chatID", "recipient", "sender", "datetime", "data"]

    for each in reader:
        row = {}
        for field in header:
            row[field] = each[field]

        db.chat.insert_one(row)

    print("Database Updated")

if db.chat.count_documents({}) > 0:
    print("Database populated")
else:
    popDB()

from app import app
