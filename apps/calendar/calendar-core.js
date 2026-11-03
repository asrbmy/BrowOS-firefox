// Calendar core: events, repeats and which ones are due.
// Loaded by the Calendar app and by the desktop (reminders must fire when the app is closed).

window.BrowCalendar = (function () {
	const KEY = "browos-calendar";

	function load() {
		try {
			const list = JSON.parse(localStorage.getItem(KEY) || "[]");

			return Array.isArray(list) ? list.filter((e) => e && typeof e.title === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) : [];
		} catch (error) {
			return [];
		}
	}

	function save(list) {
		localStorage.setItem(KEY, JSON.stringify(list));

		window.dispatchEvent(new Event("browos-calendar-changed"));

		try {
			if (window.parent !== window) {
				window.parent.document.dispatchEvent(new Event("calendar-changed"));
			} else {
				document.dispatchEvent(new Event("calendar-changed"));
			}
		} catch (error) {
			// another origin, nothing to tell
		}
	}

	function pad(n) {
		return String(n).padStart(2, "0");
	}

	function dateKey(d) {
		return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
	}

	function parseKey(key) {
		const p = key.split("-").map(Number);

		return new Date(p[0], p[1] - 1, p[2]);
	}

	function occursOn(event, key) {
		if (key < event.date) {
			return false;
		}

		if (event.until && key > event.until) {
			return false;
		}

		if (key === event.date) {
			return true;
		}

		const start = parseKey(event.date);
		const day = parseKey(key);

		switch (event.repeat) {
			case "daily":
				return true;
			case "weekdays":
				return day.getDay() !== 0 && day.getDay() !== 6;
			case "weekly":
				return day.getDay() === start.getDay();
			case "monthly":
				return day.getDate() === start.getDate();
			case "yearly":
				return day.getDate() === start.getDate() && day.getMonth() === start.getMonth();
			default:
				return false;
		}
	}

	function sortEvents(list) {
		return list.slice().sort(function (a, b) {
			return (a.time || "") < (b.time || "") ? -1 : (a.time || "") > (b.time || "") ? 1 : a.title.localeCompare(b.title);
		});
	}

	function eventsOn(key, list) {
		return sortEvents((list || load()).filter((e) => occursOn(e, key)));
	}

	// the moment an occurrence starts (all day events count from 09:00)
	function startOf(event, key) {
		const time = event.time || "09:00";

		const p = parseKey(key);

		p.setHours(Number(time.slice(0, 2)), Number(time.slice(3, 5)), 0, 0);

		return p.getTime();
	}

	function newId() {
		return "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
	}

	// reminders that are due now: [{event, key, startsAt}]
	function dueReminders(now, firedMap) {
		const list = load();

		const due = [];

		for (let offset = -1; offset <= 2; offset++) {
			const day = new Date(now);

			day.setDate(day.getDate() + offset);

			const key = dateKey(day);

			list.forEach(function (event) {
				if (typeof event.remind !== "number" || event.remind < 0 || !occursOn(event, key)) {
					return;
				}

				const startsAt = startOf(event, key);

				const fireAt = startsAt - event.remind * 60000;

				const id = event.id + "@" + key;

				// still worth showing for up to 6 hours after it should have fired
				if (now >= fireAt && now - fireAt < 6 * 3600000 && !firedMap[id]) {
					due.push({ event: event, key: key, startsAt: startsAt, id: id });
				}
			});
		}

		return due;
	}

	return { load, save, dateKey, parseKey, occursOn, eventsOn, startOf, newId, dueReminders, sortEvents };
})();
