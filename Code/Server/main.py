from flask import Flask
from flask import jsonify

app = Flask("flask_serv")
app.config["DEBUG"] = True

@app.route("/heartbeat")
def route():
    return {"villeChoisie":"Quebec"}

if __name__ == '__main__': 
    app.run(host='0.0.0.0',port='8080')