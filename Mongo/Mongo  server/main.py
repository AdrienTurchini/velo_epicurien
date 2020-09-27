from flask import Flask
from flask import jsonify
import os

application = Flask('demo_flask')
env = os.environ['env']
if env == "prod":
    debug=False
    port = 80
elif env == "dev":
    debug=True
    port = 8080
else:
    raise ValueError("No known behavior for env={}".format(env))

@application.route("/heartbeat")
def route():
    return {"villeChoisie":"BeauportBeach"}

if __name__ == "__main__":
    application.run('0.0.0.0', port=port, debug=debug)