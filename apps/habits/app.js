// Habits: tick a habit each day, keep the streak

const KEY = "browos-habits";
const root = document.getElementById("app");

function load() {
	try {
		const list = JSON.parse(localStorage.getItem(KEY) || "[]");

		return Array.isArray(list) ? list.filter((h) => h && typeof h.name === "string" && Array.isArray(h.done)) : [];
	} catch (error) {
		return [];
	}
}

let habits = load();

function save() {
	localStorage.setItem(KEY, JSON.stringify(habits));
}

function key(date) {
	return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function daysAgo(n) {
	const d = new Date();

	d.setDate(d.getDate() - n);

	return d;
}

// days in a row up to today (today may still be open: yesterday keeps the streak alive)
function streak(habit) {
	const done = new Set(habit.done);

	let n = done.has(key(daysAgo(0))) ? 0 : 1;

	let count = 0;

	while (done.has(key(daysAgo(n)))) {
		count++;
		n++;
	}

	return count;
}

function render() {
	root.innerHTML = "";

	const form = document.createElement("form");

	form.className = "h-add";

	const input = document.createElement("input");

	input.placeholder = "New habit, for example Drink water";
	input.maxLength = 60;

	const add = document.createElement("button");

	add.className = "primary";
	add.textContent = "Add";

	form.append(input, add);

	form.addEventListener("submit", function (event) {
		event.preventDefault();

		const name = input.value.trim();

		if (name) {
			habits.push({ id: "h" + Date.now().toString(36), name: name, done: [] });

			save();

			render();
		}
	});

	root.appendChild(form);

	if (habits.length === 0) {
		const empty = document.createElement("div");

		empty.className = "h-empty muted";
		empty.textContent = "No habits yet. Add one above.";

		root.appendChild(empty);

		return;
	}

	habits.forEach(function (habit) {
		const row = document.createElement("div");

		row.className = "h-row";

		const left = document.createElement("div");

		const name = document.createElement("div");

		name.className = "h-name";
		name.textContent = habit.name;

		const info = document.createElement("div");

		info.className = "h-streak";

		const s = streak(habit);

		info.textContent = s ? "🔥 " + s + (s === 1 ? " day" : " days") + " in a row" : "No streak yet";

		left.append(name, info);

		const del = document.createElement("button");

		del.className = "h-del";
		del.textContent = "Delete";

		del.addEventListener("click", function () {
			if (confirm("Delete " + habit.name + " and its history?")) {
				habits = habits.filter((h) => h !== habit);

				save();

				render();
			}
		});

		const days = document.createElement("div");

		days.className = "h-days";

		for (let n = 6; n >= 0; n--) {
			const date = daysAgo(n);

			const k = key(date);

			const cell = document.createElement("button");

			cell.className = "h-day" + (habit.done.includes(k) ? " done" : "") + (n === 0 ? " today" : "");
			cell.innerHTML = "";

			const top = document.createElement("div");

			top.textContent = date.toLocaleDateString(undefined, { weekday: "short" });

			const bottom = document.createElement("div");

			bottom.textContent = habit.done.includes(k) ? "✓" : date.getDate();

			cell.append(top, bottom);

			cell.setAttribute("aria-pressed", habit.done.includes(k));
			cell.setAttribute("aria-label", habit.name + ", " + date.toDateString());

			cell.addEventListener("click", function () {
				habit.done = habit.done.includes(k) ? habit.done.filter((d) => d !== k) : habit.done.concat(k);

				save();

				render();
			});

			days.appendChild(cell);
		}

		row.append(left, del, days);

		root.appendChild(row);
	});
}

render();
