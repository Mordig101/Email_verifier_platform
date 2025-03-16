import os
import csv
import logging
import json
import base64
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(name)s - %(message)s',
    handlers=[
        logging.FileHandler("settings.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class Settings:
    def __init__(self, settings_file: str = "settings/settings.csv"):
        """
        Initialize the settings manager.
        
        Args:
            settings_file: Path to the settings CSV file
        """
        self.settings_file = settings_file
        self.settings: Dict[str, Dict[str, Any]] = {}
        self._ensure_settings_file()
        self._ensure_data_folders()
        self.load_settings()
        
        # Initialize encryption key
        self._init_encryption()

    def _init_encryption(self) -> None:
        """Initialize encryption for sensitive data."""
        key_file = os.path.join(os.path.dirname(self.settings_file), "encryption.key")
        
        if not os.path.exists(key_file):
            # Generate a new key
            salt = os.urandom(16)
            # Use a default password, in production this should be more secure
            password = b"email_verifier_default_password"
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password))
            
            # Save the key and salt
            os.makedirs(os.path.dirname(key_file), exist_ok=True)
            with open(key_file, 'wb') as f:
                f.write(key)
            
            salt_file = os.path.join(os.path.dirname(self.settings_file), "salt.bin")
            with open(salt_file, 'wb') as f:
                f.write(salt)
        else:
            # Load existing key
            with open(key_file, 'rb') as f:
                key = f.read()
        
        self.cipher_suite = Fernet(key)

    def _encrypt(self, data: str) -> str:
        """
        Encrypt sensitive data.
        
        Args:
            data: The data to encrypt
            
        Returns:
            str: The encrypted data as a base64 string
        """
        if not data:
            return ""
        
        encrypted = self.cipher_suite.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    def _decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt sensitive data.
        
        Args:
            encrypted_data: The encrypted data as a base64 string
            
        Returns:
            str: The decrypted data
        """
        if not encrypted_data:
            return ""
        
        try:
            decoded = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher_suite.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Error decrypting data: {e}")
            return ""

    def _ensure_settings_file(self) -> None:
        """Ensure the settings directory and file exist."""
        os.makedirs(os.path.dirname(self.settings_file), exist_ok=True)
        
        # Create settings file with default values if it doesn't exist
        if not os.path.exists(self.settings_file):
            default_settings = [
                # Feature, Value, Enabled
                ["proxy_enabled", "False", "False"],
                ["proxy_list", "", "False"],
                ["screenshot_location", "./screenshots", "True"],
                ["screenshot_mode", "problems", "True"],
                ["smtp_accounts", "", "False"],
                ["user_agent_rotation", "True", "True"],
                ["microsoft_api", "True", "True"],
                ["catch_all_detection", "True", "True"],
                # Multi-terminal support
                ["multi_terminal_enabled", "False", "False"],
                ["terminal_count", "2", "False"],
                ["real_multiple_terminals", "False", "False"],
                # Verification loop
                ["verification_loop_enabled", "True", "True"],
                # Browser selection
                ["browsers", "chrome,edge,firefox", "True"],
                # Browser wait time
                ["browser_wait_time", "3", "True"],
                # Browser display
                ["browser_headless", "False", "False"],
                # Rate limiting
                ["rate_limit_enabled", "True", "True"],
                ["rate_limit_max_requests", "10", "True"],
                ["rate_limit_time_window", "60", "True"],
                # Security
                ["secure_credentials", "True", "True"],
                # Logging
                ["log_level", "INFO", "True"],
                ["log_to_file", "True", "True"],
                ["log_file", "./email_verifier.log", "True"]
            ]
            
            with open(self.settings_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["feature", "value", "enabled"])
                for setting in default_settings:
                    writer.writerow(setting)

    def _ensure_data_folders(self) -> None:
        """Ensure the data folders and files exist."""
        data_dir = "./data"
        os.makedirs(data_dir, exist_ok=True)
        
        # Create required data files if they don't exist
        data_files = [
            "D-blacklist.csv",
            "D-WhiteList.csv",
            "Valid.csv",
            "Invalid.csv",
            "Risky.csv",
            "Custom.csv"
        ]
        
        for file in data_files:
            file_path = os.path.join(data_dir, file)
            if not os.path.exists(file_path):
                with open(file_path, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    if file in ["D-blacklist.csv", "D-WhiteList.csv"]:
                        writer.writerow(["domain"])
                    else:
                        writer.writerow(["email"])
        
        # Create statistics directory
        stats_dir = "./statistics"
        os.makedirs(stats_dir, exist_ok=True)
        
        # Create history directory
        history_dir = os.path.join(stats_dir, "history")
        os.makedirs(history_dir, exist_ok=True)
        
        # Create history files if they don't exist
        for category in ["valid", "invalid", "risky", "custom"]:
            history_file = os.path.join(history_dir, f"{category}.json")
            if not os.path.exists(history_file):
                with open(history_file, 'w', encoding='utf-8') as f:
                    json.dump({}, f, indent=4)
        
        # Create temp history file
        temp_history_file = os.path.join(history_dir, "temp_history.json")
        if not os.path.exists(temp_history_file):
            with open(temp_history_file, 'w', encoding='utf-8') as f:
                json.dump({}, f, indent=4)

    def load_settings(self) -> None:
        """Load settings from the CSV file."""
        try:
            with open(self.settings_file, 'r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.settings[row["feature"]] = {
                        "value": row["value"],
                        "enabled": row["enabled"].lower() == "true"
                    }
            logger.info(f"Settings loaded from {self.settings_file}")
        except Exception as e:
            logger.error(f"Error loading settings: {e}")
            # Use default settings if loading fails
            self.settings = {
                "proxy_enabled": {"value": "False", "enabled": False},
                "proxy_list": {"value": "", "enabled": False},
                "screenshot_location": {"value": "./screenshots", "enabled": True},
                "screenshot_mode": {"value": "problems", "enabled": True},
                "smtp_accounts": {"value": "", "enabled": False},
                "user_agent_rotation": {"value": "True", "enabled": True},
                "microsoft_api": {"value": "True", "enabled": True},
                "catch_all_detection": {"value": "True", "enabled": True},
                "multi_terminal_enabled": {"value": "False", "enabled": False},
                "terminal_count": {"value": "2", "enabled": False},
                "real_multiple_terminals": {"value": "False", "enabled": False},
                "verification_loop_enabled": {"value": "True", "enabled": True},
                "browsers": {"value": "chrome,edge,firefox", "enabled": True},
                "browser_wait_time": {"value": "3", "enabled": True},
                "browser_headless": {"value": "False", "enabled": False},
                "rate_limit_enabled": {"value": "True", "enabled": True},
                "rate_limit_max_requests": {"value": "10", "enabled": True},
                "rate_limit_time_window": {"value": "60", "enabled": True},
                "secure_credentials": {"value": "True", "enabled": True},
                "log_level": {"value": "INFO", "enabled": True},
                "log_to_file": {"value": "True", "enabled": True},
                "log_file": {"value": "./email_verifier.log", "enabled": True}
            }

    def save_settings(self) -> bool:
        """
        Save current settings to the CSV file.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with open(self.settings_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(["feature", "value", "enabled"])
                for feature, data in self.settings.items():
                    writer.writerow([feature, data["value"], str(data["enabled"])])
            logger.info(f"Settings saved to {self.settings_file}")
            return True
        except Exception as e:
            logger.error(f"Error saving settings: {e}")
            return False

    def get(self, feature: str, default: Any = None) -> Any:
        """
        Get a setting value if it exists and is enabled.
        
        Args:
            feature: The feature name
            default: Default value if feature not found or disabled
            
        Returns:
            Any: The setting value or default
        """
        if feature in self.settings and self.settings[feature]["enabled"]:
            return self.settings[feature]["value"]
        return default

    def is_enabled(self, feature: str) -> bool:
        """
        Check if a feature is enabled.
        
        Args:
            feature: The feature name
            
        Returns:
            bool: True if enabled, False otherwise
        """
        return feature in self.settings and self.settings[feature]["enabled"]

    def set(self, feature: str, value: str, enabled: bool = True) -> bool:
        """
        Set a setting value and enabled status.
        
        Args:
            feature: The feature name
            value: The feature value
            enabled: Whether the feature is enabled
            
        Returns:
            bool: True if successful, False otherwise
        """
        self.settings[feature] = {
            "value": value,
            "enabled": enabled
        }
        return self.save_settings()

    def get_smtp_accounts(self) -> List[Dict[str, Any]]:
        """
        Get the list of SMTP accounts for verifier2.
        
        Returns:
            List[Dict[str, Any]]: List of SMTP account dictionaries
        """
        accounts_str = self.get("smtp_accounts", "")
        if not accounts_str:
            return []
        
        accounts = []
        for account_str in accounts_str.split("|"):
            parts = account_str.split(",")
            if len(parts) == 6:  # Make sure we have all 6 parts
                # Decrypt password if secure credentials is enabled
                password = parts[5]
                if self.is_enabled("secure_credentials"):
                    password = self._decrypt(password)
                
                accounts.append({
                    "smtp_server": parts[0],
                    "smtp_port": int(parts[1]),
                    "imap_server": parts[2],
                    "imap_port": int(parts[3]),
                    "email": parts[4],
                    "password": password
                })
        return accounts

    def add_smtp_account(self, smtp_server: str, smtp_port: int, imap_server: str, 
                         imap_port: int, email: str, password: str) -> bool:
        """
        Add an SMTP account for verifier2.
        
        Args:
            smtp_server: SMTP server hostname
            smtp_port: SMTP server port
            imap_server: IMAP server hostname
            imap_port: IMAP server port
            email: Email address
            password: Password
            
        Returns:
            bool: True if successful, False otherwise
        """
        accounts = self.get_smtp_accounts()
        
        # Check if account already exists
        for account in accounts:
            if account["email"] == email:
                return False
        
        # Encrypt password if secure credentials is enabled
        if self.is_enabled("secure_credentials"):
            password = self._encrypt(password)
        
        # Add the new account
        accounts_str = self.get("smtp_accounts", "")
        if accounts_str:
            accounts_str += "|"
        
        accounts_str += f"{smtp_server},{smtp_port},{imap_server},{imap_port},{email},{password}"
        return self.set("smtp_accounts", accounts_str, True)

    def get_proxies(self) -> List[str]:
        """
        Get the list of proxies.
        
        Returns:
            List[str]: List of proxy strings
        """
        proxies_str = self.get("proxy_list", "")
        if not proxies_str:
            return []
        
        return [proxy.strip() for proxy in proxies_str.split("|") if proxy.strip()]

    def add_proxy(self, proxy: str) -> bool:
        """
        Add a proxy to the list.
        
        Args:
            proxy: The proxy string (host:port)
            
        Returns:
            bool: True if successful, False otherwise
        """
        proxies = self.get_proxies()
        
        # Check if proxy already exists
        if proxy in proxies:
            return False
        
        # Add the new proxy
        proxies_str = self.get("proxy_list", "")
        if proxies_str:
            proxies_str += "|"
        
        proxies_str += proxy
        return self.set("proxy_list", proxies_str, True)

    def get_browsers(self) -> List[str]:
        """
        Get the list of browsers to use.
        
        Returns:
            List[str]: List of browser names
        """
        browsers_str = self.get("browsers", "chrome")
        return [browser.strip() for browser in browsers_str.split(",") if browser.strip()]

    def get_browser_wait_time(self) -> int:
        """
        Get the browser wait time in seconds.
        
        Returns:
            int: Wait time in seconds
        """
        try:
            return int(self.get("browser_wait_time", "3"))
        except ValueError:
            return 3

    def get_terminal_count(self) -> int:
        """
        Get the number of terminals to use for multi-terminal support.
        
        Returns:
            int: Number of terminals
        """
        try:
            return int(self.get("terminal_count", "2"))
        except ValueError:
            return 2

    def get_rate_limit_settings(self) -> Tuple[int, int]:
        """
        Get rate limit settings.
        
        Returns:
            Tuple[int, int]: (max_requests, time_window)
        """
        try:
            max_requests = int(self.get("rate_limit_max_requests", "10"))
            time_window = int(self.get("rate_limit_time_window", "60"))
            return max_requests, time_window
        except ValueError:
            return 10, 60

    def get_blacklisted_domains(self) -> List[str]:
        """
        Get the list of blacklisted domains.
        
        Returns:
            List[str]: List of blacklisted domains
        """
        try:
            with open("./data/D-blacklist.csv", 'r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return [row["domain"] for row in reader]
        except Exception as e:
            logger.error(f"Error loading blacklisted domains: {e}")
            return []

    def get_whitelisted_domains(self) -> List[str]:
        """
        Get the list of whitelisted domains.
        
        Returns:
            List[str]: List of whitelisted domains
        """
        try:
            with open("./data/D-WhiteList.csv", 'r', newline='', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return [row["domain"] for row in reader]
        except Exception as e:
            logger.error(f"Error loading whitelisted domains: {e}")
            return []

    def check_email_in_data(self, email: str) -> Tuple[bool, Optional[str]]:
        """
        Check if an email exists in any of the data files.
        
        Args:
            email: The email address to check
            
        Returns:
            Tuple[bool, Optional[str]]: (exists, category)
        """
        categories = ["Valid", "Invalid", "Risky", "Custom"]
        
        for category in categories:
            try:
                with open(f"./data/{category}.csv", 'r', newline='', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    if any(row["email"] == email for row in reader):
                        return True, category.lower()
            except Exception as e:
                logger.error(f"Error checking {category}.csv: {e}")
        
        return False, None

    def add_email_to_data(self, email: str, category: str) -> bool:
        """
        Add an email to the appropriate data file.
        
        Args:
            email: The email address to add
            category: The category (valid, invalid, risky, custom)
            
        Returns:
            bool: True if successful, False otherwise
        """
        if category.lower() not in ["valid", "invalid", "risky", "custom"]:
            logger.error(f"Invalid category: {category}")
            return False
        
        try:
            file_path = f"./data/{category.capitalize()}.csv"
            
            # Check if email already exists in the file
            exists = False
            try:
                with open(file_path, 'r', newline='', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    exists = any(row["email"] == email for row in reader)
            except Exception:
                pass
            
            if not exists:
                with open(file_path, 'a', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow([email])
                
                logger.info(f"Added {email} to {category} list")
                return True
            else:
                logger.info(f"{email} already exists in {category} list")
                return True
        except Exception as e:
            logger.error(f"Error adding email to {category} list: {e}")
            return False

    def save_verification_statistics(self, verification_name: str, statistics: Dict[str, Any]) -> bool:
        """
        Save verification statistics to a JSON file.
        
        Args:
            verification_name: Name of the verification
            statistics: Statistics dictionary
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            stats_dir = "./statistics"
            os.makedirs(stats_dir, exist_ok=True)
            
            file_path = os.path.join(stats_dir, f"{verification_name}.json")
            
            # Add timestamp to statistics
            statistics["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(statistics, f, indent=4)
            
            logger.info(f"Statistics saved to {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving statistics: {e}")
            return False

    def get_verification_names(self) -> List[str]:
        """
        Get the list of verification names from the statistics directory.
        
        Returns:
            List[str]: List of verification names
        """
        try:
            stats_dir = "./statistics"
            if not os.path.exists(stats_dir):
                return []
            
            return [os.path.splitext(file)[0] for file in os.listdir(stats_dir) 
                   if file.endswith(".json") and not file.startswith("history_")]
        except Exception as e:
            logger.error(f"Error getting verification names: {e}")
            return []

    def get_verification_statistics(self, verification_name: str) -> Optional[Dict[str, Any]]:
        """
        Get verification statistics from a JSON file.
        
        Args:
            verification_name: Name of the verification
            
        Returns:
            Optional[Dict[str, Any]]: Statistics dictionary or None if not found
        """
        try:
            file_path = f"./statistics/{verification_name}.json"
            
            if not os.path.exists(file_path):
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading statistics: {e}")
            return None

    def save_verification_history(self, email: str, category: str, history: List[Dict[str, str]]) -> bool:
        """
        Save verification history for an email to the appropriate JSON file.
        
        Args:
            email: The email address
            category: The category (valid, invalid, risky, custom)
            history: List of history events
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            history_dir = os.path.join("./statistics", "history")
            os.makedirs(history_dir, exist_ok=True)
            
            file_path = os.path.join(history_dir, f"{category}.json")
            
            # Load existing history
            existing_history = {}
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    existing_history = json.load(f)
            
            # Add or update this email's history
            existing_history[email] = history
            
            # Save updated history
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(existing_history, f, indent=4)
            
            logger.info(f"Saved verification history for {email} to {category} history")
            return True
        except Exception as e:
            logger.error(f"Error saving verification history for {email}: {e}")
            return False

    def get_verification_history(self, email: Optional[str] = None, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Get verification history for a specific email or category.
        
        Args:
            email: The email address to get history for
            category: The category to get history for
            
        Returns:
            Dict[str, Any]: The verification history
        """
        history_dir = os.path.join("./statistics", "history")
        
        if email:
            # Get history for a specific email
            for cat in ["valid", "invalid", "risky", "custom"]:
                file_path = os.path.join(history_dir, f"{cat}.json")
                try:
                    if os.path.exists(file_path):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            history = json.load(f)
                            if email in history:
                                return {email: history[email]}
                except Exception as e:
                    logger.error(f"Error loading history for {email}: {e}")
            
            return {}
        
        elif category:
            # Get history for a specific category
            file_path = os.path.join(history_dir, f"{category}.json")
            try:
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        return json.load(f)
            except Exception as e:
                logger.error(f"Error loading history for category {category}: {e}")
            
            return {}
        
        else:
            # Get all history
            all_history = {}
            for cat in ["valid", "invalid", "risky", "custom"]:
                file_path = os.path.join(history_dir, f"{cat}.json")
                try:
                    if os.path.exists(file_path):
                        with open(file_path, 'r', encoding='utf-8') as f:
                            all_history[cat] = json.load(f)
                except Exception as e:
                    logger.error(f"Error loading history for category {cat}: {e}")
                    all_history[cat] = {}
            
            return all_history

    def get_log_level(self) -> int:
        """
        Get the log level.
        
        Returns:
            int: The log level as a logging constant
        """
        level_str = self.get("log_level", "INFO").upper()
        level_map = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARNING": logging.WARNING,
            "ERROR": logging.ERROR,
            "CRITICAL": logging.CRITICAL
        }
        return level_map.get(level_str, logging.INFO)

    def get_log_file(self) -> Optional[str]:
        """
        Get the log file path if logging to file is enabled.
        
        Returns:
            Optional[str]: The log file path or None if disabled
        """
        if self.is_enabled("log_to_file"):
            return self.get("log_file", "./email_verifier.log")
        return None