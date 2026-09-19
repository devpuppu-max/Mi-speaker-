from flask import Flask, jsonify

app = Flask(__name__)

command = "none"

@app.route("/")
def home():
    return "Mi Speaker Server Running"

@app.route("/power")
def power():
    global command
    command = "power"
    return "POWER command sent"

@app.route("/get")
def get_command():
    global command

    old_command = command
    command = "none"

    return jsonify({"command": old_command})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
