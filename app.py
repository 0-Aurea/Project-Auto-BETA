CONTENT:
from flask import Flask, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__, static_folder='web', template_folder='web')
CORS(app) # Enable CORS for all routes, useful for development if frontend is served separately

@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

@app.route('/api/greeting')
def get_greeting():
    """Provides a simple API endpoint for a dynamic greeting."""
    return jsonify({"message": "Hello from the AI system's backend!"})

if __name__ == '__main__':
    # In a production environment, you'd use a more robust WSGI server
    # like Gunicorn or uWSGI. For development, Flask's built-in server is fine.
    app.run(debug=True, port=5000)