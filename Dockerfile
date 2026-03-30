FROM python:3.12-slim
LABEL maintainer="Matt Farrell <matthew.h.farrell@gmail.com>"
COPY requirements.txt /app/requirements.txt
WORKDIR /app
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
ENV FLASK_APP="./code/chat.py"
EXPOSE 5000
CMD ["python", "-m", "flask", "run", "--host", "0.0.0.0"]
