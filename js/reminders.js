// Calendar reminders
// Checks the calendar every 20 seconds and shows a notification when one is due.

(function () {
	const FIRED_KEY = "browos-calendar-fired";

	function loadFired() {
		try {
			return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}") || {};
		} catch (error) {
			return {};
		}
	}

	function check() {
		const fired = loadFired();

		const now = Date.now();

		const due = BrowCalendar.dueReminders(now, fired);

		due.forEach(function (item) {
			fired[item.id] = now;

			const when = new Date(item.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

			notify(item.event.title, item.event.time ? "Starts at " + when : "Today", { important: true, sound: "alarm" });
		});

		// forget old ones so the list does not grow forever
		Object.keys(fired).forEach(function (id) {
			if (now - fired[id] > 3 * 86400000) {
				delete fired[id];
			}
		});

		if (due.length || Object.keys(fired).length) {
			localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
		}
	}

	check();

	setInterval(check, 20000);

	document.addEventListener("calendar-changed", check);
})();
