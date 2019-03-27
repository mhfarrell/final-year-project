import os
import csv
import json
import sys, getopt, pprint
from pymongo import MongoClient
#CSV to JSON Conversion
csvfile = open(os.path.join(sys.path[0], "resources\chat.csv"), "r")
reader = csv.DictReader( csvfile )
print("Loaded CSV")
c = MongoClient('mongodb://admin:Admin123@ds145555.mlab.com:45555/chatdatabase')
db= c.chatdatabase
print("Loaded DB")

def popDB():
    db.chat.drop()
    header= [ "msgID", "chatID", "To", "From", "Date", "Time", "Data"]

    for each in reader:
        row={}
        for field in header:
            row[field]=each[field]
            
        db.chat.insert(row)

    print("Database Updated")

if db.chat.find().count() > 0:
    print("Database populated")
    userInput = input("Would you like to reset data?(Y/N) ")
    if userInput == "Y":
        popDB()
else:
    popDB()
