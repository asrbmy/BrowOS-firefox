// Notifications
// notify("Title", "Message") shows a toast and keeps it in the notification center.

const NOTIFICATIONS_KEY = "browos-notifications";
const MAX_NOTIFICATIONS = 50;

const notificationCenter = document.getElementById("notificationCenter");
const notificationList = document.getElementById("notificationList");
const notificationEmpty = document.getElementById("notificationEmpty");
const notificationClear = document.getElementById("notificationClear");
const notificationDnd = document.getElementById("notificationDnd");
const toastStack = document.getElementById("toastStack");

let notifications = [];

try {
	const saved = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY));

	if (Array.isArray(saved)) {
		notifications = saved.filter(function (item) {
			return item && typeof item.title === "string";
		});
	}
} catch (error) {
	notifications = [];
}

function doNotDisturb() {
	return localStorage.getItem("browos-dnd") === "on";
}

function setDoNotDisturb(on) {
	localStorage.setItem("browos-dnd", on ? "on" : "off");

	document.dispatchEvent(new Event("dnd-changed"));
}

function saveNotifications() {
	try {
		localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
	} catch (error) {
		// storage is full, the list just isn't kept
	}
}

function unreadCount() {
	return notifications.filter(function (item) {
		return !item.read;
	}).length;
}

function timeAgo(time) {
	const minutes = Math.floor((Date.now() - time) / 60000);

	if (minutes < 1) {
		return "Just now";
	}

	if (minutes < 60) {
		return minutes + " min ago";
	}

	const hours = Math.floor(minutes / 60);

	if (hours < 24) {
		return hours + " h ago";
	}

	return new Date(time).toLocaleDateString([], { day: "numeric", month: "short" });
}

function renderNotifications() {
	notificationList.innerHTML = "";

	notifications.forEach(function (item) {
		const row = document.createElement("div");

		row.className = "notification-item";

		const top = document.createElement("div");

		top.className = "notification-top";

		const title = document.createElement("span");

		title.className = "notification-title";
		title.textContent = item.title;

		const time = document.createElement("span");

		time.className = "notification-time";
		time.textContent = timeAgo(item.time);

		top.append(title, time);

		row.appendChild(top);

		if (item.message) {
			const message = document.createElement("div");

			message.className = "notification-message";
			message.textContent = item.message;

			row.appendChild(message);
		}

		const remove = document.createElement("button");

		remove.className = "notification-remove";
		remove.textContent = "×";
		remove.title = "Dismiss";

		remove.addEventListener("click", function () {
			notifications = notifications.filter(function (other) {
				return other !== item;
			});

			saveNotifications();
			renderNotifications();
		});

		row.appendChild(remove);

		notificationList.appendChild(row);
	});

	notificationEmpty.hidden = notifications.length > 0;

	notificationClear.hidden = notifications.length === 0;

	document.dispatchEvent(new Event("notifications-changed"));
}

function showNotificationToast(item, duration) {
	const toast = document.createElement("div");

	toast.className = "toast";

	const title = document.createElement("div");

	title.className = "toast-title";
	title.textContent = item.title;

	toast.appendChild(title);

	if (item.message) {
		const message = document.createElement("div");

		message.className = "toast-message";
		message.textContent = item.message;

		toast.appendChild(message);
	}

	function hide() {
		toast.classList.add("leaving");

		setTimeout(function () {
			toast.remove();
		}, 250);
	}

	toast.addEventListener("click", hide);

	toastStack.appendChild(toast);

	// only a few toasts at a time
	while (toastStack.childElementCount > 4) {
		toastStack.firstElementChild.remove();
	}

	setTimeout(hide, duration);
}

// options: { important: ignores Do not disturb, sound: false or "alarm", duration: ms }
function notify(title, message, options) {
	const settings = options || {};

	const item = {
		title: String(title || "BrowOS").slice(0, 80),
		message: String(message || "").slice(0, 300),
		time: Date.now(),
		read: false,
	};

	notifications.unshift(item);

	notifications = notifications.slice(0, MAX_NOTIFICATIONS);

	saveNotifications();
	renderNotifications();

	if (doNotDisturb() && !settings.important) {
		return;
	}

	showNotificationToast(item, settings.duration || 5000);

	if (settings.sound !== false && typeof playUiSound === "function") {
		if (settings.important || settings.sound === "alarm") {
			playUiSound(settings.sound === "alarm" ? "alarm" : "notify", true);
		} else {
			playUiSound("notify");
		}
	}
}

// the center

function openNotificationCenter() {
	closeFlyouts("notificationCenter");

	notificationCenter.classList.add("show");

	// everything shown is read
	notifications.forEach(function (item) {
		item.read = true;
	});

	saveNotifications();
	renderNotifications();
}

function toggleNotificationCenter() {
	if (notificationCenter.classList.contains("show")) {
		notificationCenter.classList.remove("show");
	} else {
		openNotificationCenter();
	}
}

notificationClear.addEventListener("click", function () {
	notifications = [];

	saveNotifications();
	renderNotifications();
});

notificationDnd.checked = doNotDisturb();

notificationDnd.addEventListener("change", function () {
	setDoNotDisturb(notificationDnd.checked);
});

document.addEventListener("dnd-changed", function () {
	notificationDnd.checked = doNotDisturb();
});

renderNotifications();
