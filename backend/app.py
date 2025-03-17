from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
import os
import json
import csv
import time
import threading
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import secrets
from datetime import datetime, timedelta

# Import the verifier service
from services.verifier_service import VerifierService
from settings.settings import Settings

# Import constants
try:
    from verifier1 import VALID, INVALID, RISKY, CUSTOM
except ImportError:
    # Define constants if import fails
    VALID = "valid"
    INVALID = "invalid"
    RISKY = "risky"
    CUSTOM = "custom"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS properly to handle all routes and methods
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:3000","http://localhost:3001" ,"http://localhost:3002", "http://192.168.1.235:3000"]}},
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"])

app.secret_key = secrets.token_hex(16)

# Initialize settings and verifier service
settings = Settings()
verifier_service = VerifierService()

# User management
USERS_FILE = "users.json"

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    
    # Create default users if file doesn't exist
    default_users = {
        "admin@example.com": {
            "password": generate_password_hash("admin123"),
            "role": "admin",
            "name": "Admin User"
        },
        "user@example.com": {
            "password": generate_password_hash("user123"),
            "role": "user",
            "name": "Regular User"
        }
    }
    
    # Save default users
    with open(USERS_FILE, 'w') as f:
        json.dump(default_users, f, indent=4)
    
    return default_users

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=4)

users = load_users()

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return jsonify({"error": "Authentication required"}), 401
        if users.get(session['username'], {}).get('role') != 'admin':
            return jsonify({"error": "Admin privileges required"}), 403
        return f(*args, **kwargs)
    return decorated_function

# Routes
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    if email not in users:
        return jsonify({"error": "Invalid email or password"}), 401
    
    if not check_password_hash(users[email]["password"], password):
        return jsonify({"error": "Invalid email or password"}), 401
    
    session['username'] = email
    return jsonify({
        "message": "Login successful",
        "access_token": secrets.token_hex(16),  # Generate a token
        "user": {
            "email": email,
            "name": users[email].get("name", "User"),
            "role": users[email]["role"]
        }
    })

@app.route('/api/signup', methods=['POST', 'OPTIONS'])
def signup():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password required"}), 400
    
    if email in users:
        return jsonify({"error": "Email already exists"}), 400
    
    # Create new user with default role of "user"
    users[email] = {
        "password": generate_password_hash(password),
        "role": "user",
        "name": name
    }
    save_users(users)
    
    session['username'] = email
    return jsonify({
        "message": "Signup successful",
        "access_token": secrets.token_hex(16),  # Generate a token
        "user": {
            "email": email,
            "name": name,
            "role": "user"
        }
    })

@app.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 200
        
    session.pop('username', None)
    return jsonify({"message": "Logout successful"})

@app.route('/api/user', methods=['GET', 'OPTIONS'])
@login_required
def get_user():
    if request.method == 'OPTIONS':
        return '', 200
        
    username = session.get('username')
    return jsonify({
        "email": username,
        "name": users[username].get("name", "User"),
        "role": users[username]["role"]
    })

@app.route('/api/users', methods=['GET', 'OPTIONS'])
def get_users():
    if request.method == 'OPTIONS':
        return '', 200
        
    user_list = []
    for email, user_data in users.items():
        user_list.append({
            "email": email,
            "name": user_data.get("name", "User"),
            "role": user_data["role"]
        })
    return jsonify(user_list)

@app.route('/api/users/<email>', methods=['PUT', 'OPTIONS'])
def update_user(email):
    if request.method == 'OPTIONS':
        return '', 200
        
    if email not in users:
        return jsonify({"error": "User not found"}), 404

    data = request.json
    role = data.get('role')

    if role and role in ['user', 'admin']:
        users[email]['role'] = role
        save_users(users)
        return jsonify({"message": "User updated successfully"})

    return jsonify({"error": "Invalid role"}), 400

@app.route('/api/users/<email>', methods=['DELETE', 'OPTIONS'])
def delete_user(email):
    if request.method == 'OPTIONS':
        return '', 200
        
    if email not in users:
        return jsonify({"error": "User not found"}), 404

    if email == 'admin@example.com':
        return jsonify({"error": "Cannot delete admin user"}), 400

    if email == session.get('username'):
        return jsonify({"error": "Cannot delete your own account"}), 400

    del users[email]
    save_users(users)

    return jsonify({"message": "User deleted successfully"})

# Add missing endpoints for stats
@app.route('/api/stats/user', methods=['GET', 'OPTIONS'])
def get_user_stats():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get real stats from verifier service if possible
    try:
        stats = verifier_service.get_user_statistics()
        return jsonify(stats)
    except:
        # Fallback to mock data
        stats = {
            "total_verifications": 120,
            "valid": 80,
            "invalid": 30,
            "risky": 10,
            "top_domains": [
                ["gmail.com", 45],
                ["yahoo.com", 25],
                ["hotmail.com", 20],
                ["outlook.com", 15],
                ["aol.com", 10]
            ]
        }
        return jsonify(stats)

@app.route('/api/stats/admin', methods=['GET', 'OPTIONS'])
def get_admin_stats():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get real stats from verifier service if possible
    try:
        stats = verifier_service.get_admin_statistics()
        return jsonify(stats)
    except:
        # Fallback to mock data
        stats = {
            "total_verifications": 500,
            "valid": 320,
            "invalid": 120,
            "risky": 60,
            "total_users": 25,
            "total_batches": 15,
            "top_domains": [
                ["gmail.com", 180],
                ["yahoo.com", 95],
                ["hotmail.com", 85],
                ["outlook.com", 65],
                ["aol.com", 40]
            ],
            "top_users": [
                ["user1@example.com", 120],
                ["user2@example.com", 85],
                ["user3@example.com", 65],
                ["user4@example.com", 45],
                ["user5@example.com", 30]
            ]
        }
        return jsonify(stats)

@app.route('/api/results/recent', methods=['GET', 'OPTIONS'])
def get_recent_results():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get real recent results from verifier service if possible
    try:
        results = verifier_service.get_recent_results()
        return jsonify({"results": results})
    except:
        # Fallback to mock data
        results = {
            "results": [
                {
                    "email": "test1@gmail.com",
                    "category": "VALID",
                    "provider": "Gmail",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "email": "invalid@example.com",
                    "category": "INVALID",
                    "provider": "Unknown",
                    "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat()
                },
                {
                    "email": "risky@domain.com",
                    "category": "RISKY",
                    "provider": "Domain.com",
                    "timestamp": (datetime.now() - timedelta(minutes=10)).isoformat()
                },
                {
                    "email": "user@yahoo.com",
                    "category": "VALID",
                    "provider": "Yahoo",
                    "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat()
                },
                {
                    "email": "test@hotmail.com",
                    "category": "VALID",
                    "provider": "Hotmail",
                    "timestamp": (datetime.now() - timedelta(minutes=20)).isoformat()
                }
            ]
        }
        return jsonify(results)

@app.route('/api/logs', methods=['GET', 'OPTIONS'])
def get_logs():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get real logs from verifier service if possible
    try:
        logs = verifier_service.get_logs()
        return jsonify(logs)
    except:
        # Fallback to mock data
        logs = [
            {
                "timestamp": datetime.now().isoformat(),
                "event_type": "LOGIN",
                "user_email": "admin@example.com",
                "details": "Admin login successful"
            },
            {
                "timestamp": (datetime.now() - timedelta(minutes=30)).isoformat(),
                "event_type": "VERIFICATION",
                "user_email": "user@example.com",
                "details": "Verified 10 emails"
            },
            {
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "event_type": "SETTINGS",
                "user_email": "admin@example.com",
                "details": "Updated verification settings"
            },
            {
                "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
                "event_type": "SYSTEM",
                "user_email": None,
                "details": "System startup"
            }
        ]
        return jsonify(logs)

# Fix the statistics endpoints
@app.route('/statistics', methods=['GET', 'OPTIONS'])
@app.route('/api/statistics', methods=['GET', 'OPTIONS'])
def get_statistics_data():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get real statistics from verifier service if possible
    try:
        data = verifier_service.get_statistics()
        return jsonify(data)
    except:
        # Fallback to mock data
        data = {
            "totalUsers": 150,
            "activeUsers": 75,
            "averageSessionDuration": 15.5,
            "valid": {
                "total": 800,
                "reasons": {
                    "Email address exists": 500,
                    "Valid SMTP response": 200,
                    "Confirmed via API": 100
                }
            },
            "invalid": {
                "total": 300,
                "reasons": {
                    "Domain does not exist": 100,
                    "Mailbox not found": 150,
                    "Syntax error": 50
                }
            },
            "risky": {
                "total": 100,
                "reasons": {
                    "Catch-all domain": 60,
                    "Temporary failure": 30,
                    "Rate limited": 10
                }
            },
            "custom": {
                "total": 50,
                "reasons": {
                    "Custom validation": 30,
                    "Unknown status": 20
                }
            },
            "domains": {
                "gmail.com": {
                    "total": 500,
                    "valid": 400,
                    "invalid": 50,
                    "risky": 40,
                    "custom": 10
                },
                "yahoo.com": {
                    "total": 300,
                    "valid": 200,
                    "invalid": 80,
                    "risky": 15,
                    "custom": 5
                },
                "hotmail.com": {
                    "total": 200,
                    "valid": 150,
                    "invalid": 30,
                    "risky": 15,
                    "custom": 5
                }
            }
        }
        return jsonify(data)

@app.route('/api/statistics/verifications', methods=['GET', 'OPTIONS'])
def get_verification_names():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get real verification names from verifier service if possible
    try:
        names = verifier_service.get_verification_names()
        return jsonify(names)
    except:
        # Fallback to mock data
        names = [
            "verification_2025-03-15",
            "verification_2025-03-14",
            "verification_2025-03-13",
            "batch_gmail_2025-03-12",
            "batch_yahoo_2025-03-11"
        ]
        return jsonify(names)

@app.route('/api/statistics/verifications/<name>', methods=['GET', 'OPTIONS'])
def get_verification_statistics(name):
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get real verification statistics from verifier service if possible
    try:
        stats = verifier_service.get_verification_statistics(name)
        return jsonify(stats)
    except:
        # Fallback to mock data
        stats = {
            "timestamp": datetime.now().isoformat(),
            "valid": {
                "total": 80,
                "reasons": {
                    "Email address exists": 50,
                    "Valid SMTP response": 20,
                    "Confirmed via API": 10
                }
            },
            "invalid": {
                "total": 30,
                "reasons": {
                    "Domain does not exist": 10,
                    "Mailbox not found": 15,
                    "Syntax error": 5
                }
            },
            "risky": {
                "total": 10,
                "reasons": {
                    "Catch-all domain": 6,
                    "Temporary failure": 3,
                    "Rate limited": 1
                }
            },
            "custom": {
                "total": 5,
                "reasons": {
                    "Custom validation": 3,
                    "Unknown status": 2
                }
            },
            "domains": {
                "gmail.com": {
                    "total": 50,
                    "valid": 40,
                    "invalid": 5,
                    "risky": 4,
                    "custom": 1
                },
                "yahoo.com": {
                    "total": 30,
                    "valid": 20,
                    "invalid": 8,
                    "risky": 1,
                    "custom": 1
                },
                "hotmail.com": {
                    "total": 20,
                    "valid": 15,
                    "invalid": 3,
                    "risky": 1,
                    "custom": 1
                }
            }
        }
        return jsonify(stats)

@app.route('/api/results/summary', methods=['GET', 'OPTIONS'])
def get_results_summary():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get real results summary from verifier service if possible
    try:
        summary = verifier_service.get_results_summary()
        return jsonify(summary)
    except:
        # Fallback to mock data
        summary = {
            "valid": 800,
            "invalid": 300,
            "risky": 100,
            "custom": 50
        }
        return jsonify(summary)

@app.route('/api/verify', methods=['POST', 'OPTIONS'])
def verify_email_endpoint():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    email = data.get('email')
    method = data.get('method', 'auto')  # Get the verification method
    
    if not email:
        return jsonify({"error": "Email required"}), 400
    
    try:
        # Pass the method to the verifier service
        result = verifier_service.verify_email(email, method=method)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error verifying {email}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/verify/batch', methods=['POST', 'OPTIONS'])
def verify_batch_endpoint():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    emails = data.get('emails', [])
    method = data.get('method', 'auto')  # Get the verification method
    
    if not emails:
        return jsonify({"error": "Emails required"}), 400
    
    task_id = verifier_service.start_batch_verification(emails, method=method)
    
    return jsonify({
        "task_id": task_id,
        "message": "Verification started",
        "status": "pending"
    })

@app.route('/api/verify/status/<task_id>', methods=['GET', 'OPTIONS'])
def verify_status(task_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    task = verifier_service.get_task_status(task_id)
    
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    return jsonify(task)

@app.route('/api/verify/results/<task_id>', methods=['GET', 'OPTIONS'])
def verify_results(task_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    task = verifier_service.get_task_results(task_id)
    
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    return jsonify(task)

# Settings endpoints
@app.route('/api/settings', methods=['GET', 'OPTIONS'])
def get_settings():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Get all settings
    all_settings = {}
    for feature in settings.settings:
        all_settings[feature] = settings.settings[feature]
    
    return jsonify(all_settings)

@app.route('/api/settings', methods=['POST', 'OPTIONS'])
def update_settings():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    
    # Update settings
    for feature, setting_data in data.items():
        if isinstance(setting_data, dict):
            value = setting_data.get("value")
            enabled = setting_data.get("enabled")
            settings.set(feature, value, enabled)
    
    # Reload settings in verifier service
    verifier_service.reload_settings()
    
    return jsonify({"message": "Settings updated successfully"})

@app.route('/api/settings/browsers', methods=['GET', 'OPTIONS'])
def get_browsers():
    if request.method == 'OPTIONS':
        return '', 200
        
    browsers = settings.get_browsers()
    return jsonify(browsers)

@app.route('/api/settings/proxies', methods=['GET', 'OPTIONS'])
def get_proxies():
    if request.method == 'OPTIONS':
        return '', 200
        
    proxies = settings.get_proxies()
    return jsonify(proxies)

@app.route('/api/settings/proxies', methods=['POST', 'OPTIONS'])
def add_proxy():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    proxy = data.get('proxy')
    
    if not proxy:
        return jsonify({"error": "Proxy is required"}), 400
    
    success = settings.add_proxy(proxy)
    
    if success:
        return jsonify({"message": "Proxy added successfully"})
    else:
        return jsonify({"error": "Failed to add proxy"}), 500

@app.route('/api/settings/smtp', methods=['GET', 'OPTIONS'])
def get_smtp_accounts():
    if request.method == 'OPTIONS':
        return '', 200
        
    accounts = settings.get_smtp_accounts()
    return jsonify(accounts)

@app.route('/api/settings/smtp', methods=['POST', 'OPTIONS'])
def add_smtp_account():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    
    smtp_server = data.get('smtp_server')
    smtp_port = data.get('smtp_port')
    imap_server = data.get('imap_server')
    imap_port = data.get('imap_port')
    email = data.get('email')
    password = data.get('password')
    
    if not all([smtp_server, smtp_port, imap_server, imap_port, email, password]):
        return jsonify({"error": "All SMTP account fields are required"}), 400
    
    success = settings.add_smtp_account(smtp_server, smtp_port, imap_server, imap_port, email, password)
    
    if success:
        return jsonify({"message": "SMTP account added successfully"})
    else:
        return jsonify({"error": "Failed to add SMTP account"}), 500

@app.route('/api/domains/blacklist', methods=['GET', 'OPTIONS'])
def get_blacklisted_domains():
    if request.method == 'OPTIONS':
        return '', 200
        
    domains = settings.get_blacklisted_domains()
    return jsonify(domains)

@app.route('/api/domains/blacklist', methods=['POST', 'OPTIONS'])
def add_blacklisted_domain():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    domain = data.get('domain')
    
    if not domain:
        return jsonify({"error": "Domain is required"}), 400
    
    # Add domain to blacklist
    with open("./data/D-blacklist.csv", 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([domain])
    
    return jsonify({"message": "Domain added to blacklist successfully"})

@app.route('/api/domains/whitelist', methods=['GET', 'OPTIONS'])
def get_whitelisted_domains():
    if request.method == 'OPTIONS':
        return '', 200
        
    domains = settings.get_whitelisted_domains()
    return jsonify(domains)

@app.route('/api/domains/whitelist', methods=['POST', 'OPTIONS'])
def add_whitelisted_domain():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    domain = data.get('domain')
    
    if not domain:
        return jsonify({"error": "Domain is required"}), 400
    
    # Add domain to whitelist
    with open("./data/D-WhiteList.csv", 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([domain])
    
    return jsonify({"message": "Domain added to whitelist successfully"})

# History API
@app.route('/api/history/<email>', methods=['GET', 'OPTIONS'])
def get_email_history(email):
    if request.method == 'OPTIONS':
        return '', 200
        
    history = settings.get_verification_history(email=email)
    return jsonify(history)

@app.route('/api/history/category/<category>', methods=['GET', 'OPTIONS'])
def get_category_history(category):
    if request.method == 'OPTIONS':
        return '', 200
        
    if category not in [VALID, INVALID, RISKY, CUSTOM]:
        return jsonify({"error": "Invalid category"}), 400
    
    history = settings.get_verification_history(category=category)
    return jsonify(history)

# Health check endpoint
@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    if request.method == 'OPTIONS':
        return '', 200
        
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.route('/api/settings/rate-limit', methods=['GET', 'OPTIONS'])
def get_rate_limit_settings():
    if request.method == 'OPTIONS':
        return '', 200
        
    max_requests, time_window = settings.get_rate_limit_settings()
    return jsonify({
        "enabled": settings.is_enabled("rate_limit_enabled"),
        "max_requests": max_requests,
        "time_window": time_window
    })

@app.route('/api/settings/rate-limit', methods=['POST', 'OPTIONS'])
def update_rate_limit_settings():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.json
    enabled = data.get('enabled')
    max_requests = data.get('max_requests')
    time_window = data.get('time_window')
    
    if enabled is not None:
        settings.set("rate_limit_enabled", str(enabled), enabled)
    
    if max_requests is not None:
        settings.set("rate_limit_max_requests", str(max_requests), True)
    
    if time_window is not None:
        settings.set("rate_limit_time_window", str(time_window), True)
    
    # Reload settings in verifier service
    verifier_service.reload_settings()
    
    return jsonify({"message": "Rate limit settings updated successfully"})

@app.route('/api/statistics/methods', methods=['GET', 'OPTIONS'])
def get_method_statistics():
  if request.method == 'OPTIONS':
      return '', 200
      
  try:
      # Get real method statistics from verifier service if possible
      stats = verifier_service.get_method_statistics()
      return jsonify(stats)
  except:
      # Fallback to mock data
      stats = [
          {"method": "auto", "count": 120, "valid": 80, "invalid": 20, "risky": 15, "custom": 5},
          {"method": "login", "count": 85, "valid": 60, "invalid": 15, "risky": 8, "custom": 2},
          {"method": "smtp", "count": 35, "valid": 20, "invalid": 5, "risky": 7, "custom": 3}
      ]
      return jsonify(stats)

if __name__ == '__main__':
    # Run on all interfaces (0.0.0.0) so it's accessible from other devices on the network
    app.run(debug=True, host='0.0.0.0', port=5000)

