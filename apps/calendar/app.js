// Calendar app: month view, day agenda, events with repeat and reminders

const C = window.BrowCalendar;

const grid = document.getElementById("grid");
const titleEl = document.getElementById("title");
const dayTitle = document.getElementById("dayTitle");
const eventsEl = document.getElementById("events");
const noEvents = document.getElementById("noEvents");
const form = document.getElementById("form");
const saveButton = document.getElementById("save");
const cancelButton = document.getElementById("cancel");

const fTitle = document.getElementById("fTitle");
const fDate = document.getElementById("fDate");
const fTime = document.getElementById("fTime");
const fRepeat = document.getElementById("fRepeat");
const fRemind = document.getElementById("fRemind");
const fNotes = document.getElementById("fNotes");

let shown = new Date();
shown.setDate(1);

let selected = C.dateKey(new Date());
let editing = null;

const REPEAT_TEXT = { daily: "Every day", weekdays: "Every weekday", weekly: "Every week", monthly: "Every month", yearly: "Every year" };

// weekday header, week starts on Monday or Sunday following the browser language
const weekStart = /^en-(US|CA)|^ja|^ko|^he/.test(navigator.language) ? 0 : 1;

(function () {
	const base = new Date(2023, 0, 1); // a Sunday

	for (let i = 0; i < 7; i++) {
		const d = new Date(base);

		d.setDate(1 + ((i + weekStart) % 7));

		const cell = document.createElement("div");

		cell.textContent = d.toLocaleDateString(undefined, { weekday: "short" });

		document.getElementById("weekdays").appendChild(cell);
	}
})();

function timeText(time) {
	if (!time) {
		return "All day";
	}

	const d = new Date();

	d.setHours(Number(time.slice(0, 2)), Number(time.slice(3, 5)));

	return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function renderMonth() {
	const all = C.load();

	titleEl.textContent = shown.toLocaleDateString(undefined, { month: "long", year: "numeric" });

	grid.innerHTML = "";

	const first = new Date(shown);

	const offset = (first.getDay() - weekStart + 7) % 7;

	first.setDate(1 - offset);

	const todayKey = C.dateKey(new Date());

	for (let i = 0; i < 42; i++) {
		const d = new Date(first);

		d.setDate(first.getDate() + i);

		const key = C.dateKey(d);

		const cell = document.createElement("button");

		cell.className = "cal-cell" + (d.getMonth() !== shown.getMonth() ? " other" : "") + (key === todayKey ? " today" : "") + (key === selected ? " selected" : "");

		cell.setAttribute("role", "gridcell");
		cell.setAttribute("aria-label", d.toLocaleDateString(undefined, { dateStyle: "full" }));

		const num = document.createElement("span");

		num.className = "num";
		num.textContent = d.getDate();

		cell.appendChild(num);

		const list = C.eventsOn(key, all);

		list.slice(0, 2).forEach(function (event) {
			const chip = document.createElement("span");

			chip.className = "cal-chip";
			chip.textContent = event.title;

			cell.appendChild(chip);
		});

		if (list.length > 2) {
			const more = document.createElement("span");

			more.className = "cal-more";
			more.textContent = "+" + (list.length - 2) + " more";

			cell.appendChild(more);
		}

		cell.addEventListener("click", function () {
			selected = key;

			if (!editing) {
				fDate.value = key;
			}

			render();
		});

		cell.addEventListener("dblclick", function () {
			fTitle.focus();
		});

		grid.appendChild(cell);
	}
}

function renderDay() {
	const day = C.parseKey(selected);

	dayTitle.textContent = day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

	const list = C.eventsOn(selected);

	eventsEl.innerHTML = "";

	noEvents.hidden = list.length > 0;

	list.forEach(function (event) {
		const item = document.createElement("li");

		item.className = "cal-event";

		const title = document.createElement("b");

		title.textContent = event.title;

		const info = document.createElement("small");

		const bits = [timeText(event.time)];

		if (REPEAT_TEXT[event.repeat]) {
			bits.push(REPEAT_TEXT[event.repeat]);
		}

		if (event.remind >= 0) {
			bits.push("🔔");
		}

		info.textContent = bits.join(" · ");

		item.append(title, info);

		if (event.notes) {
			const notes = document.createElement("div");

			notes.className = "muted";
			notes.textContent = event.notes;

			item.appendChild(notes);
		}

		const buttons = document.createElement("div");

		buttons.className = "btns";

		const edit = document.createElement("button");

		edit.textContent = "Edit";

		edit.addEventListener("click", function () {
			startEdit(event);
		});

		const del = document.createElement("button");

		del.textContent = "Delete";

		del.addEventListener("click", function () {
			const question = event.repeat && event.repeat !== "none" ? "Delete all repeats of " + event.title + "?" : "Delete " + event.title + "?";

			if (confirm(question)) {
				C.save(
					C.load().filter(function (e) {
						return e.id !== event.id;
					})
				);

				if (editing === event.id) {
					stopEdit();
				}

				render();
			}
		});

		buttons.append(edit, del);

		item.appendChild(buttons);

		eventsEl.appendChild(item);
	});
}

function render() {
	renderMonth();
	renderDay();
}

function startEdit(event) {
	editing = event.id;

	fTitle.value = event.title;
	fDate.value = event.date;
	fTime.value = event.time || "";
	fRepeat.value = event.repeat || "none";
	fRemind.value = String(typeof event.remind === "number" ? event.remind : -1);
	fNotes.value = event.notes || "";

	saveButton.textContent = "Save changes";
	cancelButton.hidden = false;

	fTitle.focus();
}

function stopEdit() {
	editing = null;

	form.reset();

	fDate.value = selected;
	fRemind.value = "15";

	saveButton.textContent = "Add event";
	cancelButton.hidden = true;
}

form.addEventListener("submit", function (submit) {
	submit.preventDefault();

	const title = fTitle.value.trim();

	if (!title || !fDate.value) {
		return;
	}

	const list = C.load();

	const data = {
		title: title,
		date: fDate.value,
		time: fTime.value || "",
		repeat: fRepeat.value,
		remind: Number(fRemind.value),
		notes: fNotes.value.trim(),
	};

	if (editing) {
		const old = list.find((e) => e.id === editing);

		if (old) {
			Object.assign(old, data);
		}
	} else {
		list.push(Object.assign({ id: C.newId() }, data));
	}

	C.save(list);

	// show the day it landed on
	selected = data.date;

	const d = C.parseKey(selected);

	shown = new Date(d.getFullYear(), d.getMonth(), 1);

	stopEdit();

	render();
});

cancelButton.addEventListener("click", stopEdit);

document.getElementById("prev").addEventListener("click", function () {
	shown.setMonth(shown.getMonth() - 1);
	render();
});

document.getElementById("next").addEventListener("click", function () {
	shown.setMonth(shown.getMonth() + 1);
	render();
});

document.getElementById("today").addEventListener("click", function () {
	const now = new Date();

	shown = new Date(now.getFullYear(), now.getMonth(), 1);

	selected = C.dateKey(now);

	if (!editing) {
		fDate.value = selected;
	}

	render();
});

// changed from another place (a second window, the desktop)
window.addEventListener("storage", render);

fDate.value = selected;

render();
