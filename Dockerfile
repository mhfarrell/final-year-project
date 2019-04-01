FROM python:3.7.2
MAINTAINER Matt Farrell "matthew.farrell@students.plymouth.ac.uk"
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
ENV FLASK_APP="./code/chat.py"
CMD ["flask", "run", "--host", "0.0.0.0"]

