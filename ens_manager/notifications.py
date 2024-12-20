from enum import Enum
from datetime import datetime
import json
from pathlib import Path
import platform
import os

class NotificationType(Enum):
    API_KEY_INVALID = "api_key_invalid"
    API_KEY_EXPIRED = "api_key_expired"
    API_KEY_RATE_LIMIT = "api_key_rate_limit"
    ENS_EXPIRING = "ens_expiring"
    ENS_EXPIRED = "ens_expired"

class NotificationManager:
    def __init__(self):
        self.config_dir = Path.home() / '.ens_manager'
        self.notifications_file = self.config_dir / 'notifications.json'
        self.notifications = self.load_notifications()

    def load_notifications(self):
        if not self.notifications_file.exists():
            return []
        try:
            with open(self.notifications_file, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []

    def save_notifications(self):
        with open(self.notifications_file, 'w') as f:
            json.dump(self.notifications, f, indent=2)

    def send_notification(self, notification_type: NotificationType, message: str, provider=None):
        """Send system notification and save to history"""
        notification = {
            'type': notification_type.value,
            'message': message,
            'provider': provider,
            'timestamp': datetime.now().isoformat(),
            'read': False
        }
        
        self.notifications.append(notification)
        self.save_notifications()
        
        # Send system notification based on OS
        if platform.system() == 'Darwin':  # macOS
            os.system(f"""
                osascript -e 'display notification "{message}" with title "ENS Manager"'
            """)
        elif platform.system() == 'Linux':
            os.system(f'notify-send "ENS Manager" "{message}"')
        elif platform.system() == 'Windows':
            from win10toast import ToastNotifier
            toaster = ToastNotifier()
            toaster.show_toast("ENS Manager", message)

    def get_unread_notifications(self):
        return [n for n in self.notifications if not n['read']]

    def mark_as_read(self, notification_id):
        if 0 <= notification_id < len(self.notifications):
            self.notifications[notification_id]['read'] = True
            self.save_notifications() 