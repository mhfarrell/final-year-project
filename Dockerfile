FROM ubuntu:latest
MAINTAINER Matt Farrell "matthew.farrell@students.plymouth.ac.uk"
RUN apt-get update -y
RUN apt-get install -y python-pip python-dev build-essential
COPY . /code
WORKDIR /code
RUN pip install -r requirements.txt
ENTRYPOINT ["python"]
CMD ["chat.py"]