const info = "info", success = "success", warning = "warning", danger = "danger";

class NotificationLevel {
    // purely for getting levels and validating
    static get info() { return info; }
    static get success() { return success; }
    static get warning() { return warning; }
    static get danger() { return danger; }
    static get levels() { return [this.info, this.success, this.warning, this.danger]; }

    static validate(level_string) {
        if(!this.levels.includes(level_string)) {
            throw `Unknown message level ${level_string}`;
        }
    }
}

class Notification {
    constructor(level, message) {
        NotificationLevel.validate(level);
        this.level = level;
        this.message = message;
    }

    static remove = (deleteButton) => {
        const element = deleteButton.parentNode;
        element.parentNode.removeChild(element);
    }

    display = () => {
        const notificationContainer = document.getElementById("notification-container");
        const html = `<div class="mb-5 notification is-${this.level}">
            <button class="delete" onclick="Notification.remove(this)"></button>
            ${this.message}
        </div>`;
        // note: all of this is lazy. we should allow a list of notifications and have timeouts for each.
        // the timeout here will delete ANY notification after 5 sec, even if it is not the one referenced here.
        notificationContainer.innerHTML = html;
        setTimeout(() => {notificationContainer.innerHTML = ""}, 5000)
    }
}



class Notifications {
    static get notificationKey() { return "notifications"; }

    static displayNotificationNow(notification) {
        notification.display();
    }

    static displayNotificationOnReload(notification) {
        const notifications = this.getAllNotifications();
        notifications.push(notification);
        localStorage.setItem(this.notificationKey, JSON.stringify(notifications));
    }

    static getAllNotifications() {
        const notificationJson = localStorage.getItem(this.notificationKey) || "[]";
        return JSON.parse(notificationJson).map(json => new Notification(json.level, json.message));
    }

    static popAllNotificationsAndDisplay() {
        const notifications = this.getAllNotifications();
        $.each(notifications, (index, value) => {
            Notifications.displayNotificationNow(value);
        });
        localStorage.removeItem(this.notificationKey);
    }
}
