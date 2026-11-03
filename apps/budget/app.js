// Budget: income and expenses by month

const KEY = "browos-budget";
const CATEGORIES = ["Food", "Home", "Transport", "Fun", "Health", "Shopping", "Bills", "Other"];
const root = document.getElementById("app");
const files = window.browos && window.browos.files;

function load() {
	try {
		const list = JSON.parse(localStorage.getItem(KEY) || "[]");

		return Array.isArray(list) ? list.filter((t) => t && typeof t.amount === "number" && typeof t.date === "string") : [];
	} catch (error) {
		return [];
	}
}

let entries = load();
let month = new Date().toISOString().slice(0, 7);

function save() {
	localStorage.setItem(KEY, JSON.stringify(entries));
}

function money(n) {
	return n.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2 }).replace("US$", "$");
}

function shiftMonth(n) {
	const p = month.split("-").map(Number);

	const d = new Date(p[0], p[1] - 1 + n, 1);

	month = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");

	render();
}

function csv() {
	const rows = ["date,type,category,note,amount"].concat(
		entries
			.slice()
			.sort((a, b) => (a.date < b.date ? -1 : 1))
			.map(function (e) {
				const note = '"' + String(e.note || "").replace(/"/g, '""') + '"';

				return [e.date, e.type, e.category, note, e.amount.toFixed(2)].join(",");
			})
	);

	return rows.join("\n");
}

function render() {
	root.innerHTML = "";

	const here = entries.filter((e) => e.date.slice(0, 7) === month).sort((a, b) => (a.date < b.date ? 1 : -1));

	const income = here.filter((e) => e.type === "in").reduce((s, e) => s + e.amount, 0);
	const spent = here.filter((e) => e.type === "out").reduce((s, e) => s + e.amount, 0);

	// month bar
	const top = document.createElement("div");

	top.className = "b-top";

	const prev = document.createElement("button");
	prev.textContent = "‹";
	prev.addEventListener("click", () => shiftMonth(-1));

	const title = document.createElement("h2");
	title.textContent = new Date(month + "-01T12:00:00").toLocaleDateString(undefined, { month: "long", year: "numeric" });

	const next = document.createElement("button");
	next.textContent = "›";
	next.addEventListener("click", () => shiftMonth(1));

	top.append(prev, title, next);

	// totals
	const cards = document.createElement("div");

	cards.className = "b-cards";

	[["Income", income, "in"], ["Spent", spent, "out"], ["Balance", income - spent, ""]].forEach(function (c) {
		const card = document.createElement("div");

		card.className = "b-card " + c[2];

		const label = document.createElement("small");
		label.textContent = c[0];

		const value = document.createElement("b");
		value.textContent = money(c[1]);

		card.append(label, value);

		cards.appendChild(card);
	});

	// by category
	const bars = document.createElement("div");

	bars.className = "b-bars";

	const byCategory = {};

	here.filter((e) => e.type === "out").forEach(function (e) {
		byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
	});

	Object.keys(byCategory)
		.sort((a, b) => byCategory[b] - byCategory[a])
		.forEach(function (category) {
			const row = document.createElement("div");

			row.className = "b-bar";

			const name = document.createElement("span");
			name.textContent = category;

			const track = document.createElement("div");
			track.className = "b-track";

			const fill = document.createElement("div");
			fill.className = "b-fill";
			fill.style.width = Math.round((byCategory[category] / spent) * 100) + "%";

			track.appendChild(fill);

			const amount = document.createElement("span");
			amount.textContent = money(byCategory[category]);

			row.append(name, track, amount);

			bars.appendChild(row);
		});

	// form
	const form = document.createElement("form");

	form.className = "b-form";

	const note = document.createElement("input");
	note.placeholder = "What was it?";
	note.maxLength = 80;

	const amount = document.createElement("input");
	amount.type = "number";
	amount.step = "0.01";
	amount.min = "0.01";
	amount.placeholder = "Amount";
	amount.required = true;

	const category = document.createElement("select");
	category.innerHTML = '<option value="__in">Income</option>' + CATEGORIES.map((c) => '<option value="' + c + '">' + c + "</option>").join("");
	category.value = "Food";

	const add = document.createElement("button");
	add.className = "primary";
	add.textContent = "Add";

	form.append(note, amount, category, add);

	form.addEventListener("submit", function (event) {
		event.preventDefault();

		const value = Math.round(Number(amount.value) * 100) / 100;

		if (!(value > 0)) {
			return;
		}

		const today = new Date().toISOString().slice(0, 10);

		const date = today.slice(0, 7) === month ? today : month + "-01";

		const isIncome = category.value === "__in";

		entries.push({
			id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
			date: date,
			type: isIncome ? "in" : "out",
			category: isIncome ? "Income" : category.value,
			note: note.value.trim(),
			amount: value,
		});

		save();

		render();
	});

	// list
	const list = document.createElement("ul");

	list.className = "b-list";

	here.forEach(function (e) {
		const item = document.createElement("li");

		item.className = "b-item";

		const date = document.createElement("span");
		date.className = "muted";
		date.textContent = e.date.slice(5);

		const label = document.createElement("span");
		label.textContent = (e.note || e.category) + (e.note ? " · " + e.category : "");

		const amt = document.createElement("b");
		amt.className = "amt " + e.type;
		amt.textContent = (e.type === "in" ? "+" : "−") + money(e.amount);

		const del = document.createElement("button");
		del.textContent = "×";
		del.title = "Delete";
		del.setAttribute("aria-label", "Delete " + (e.note || e.category));

		del.addEventListener("click", function () {
			entries = entries.filter((x) => x.id !== e.id);

			save();

			render();
		});

		item.append(date, label, amt, del);

		list.appendChild(item);
	});

	// tools
	const tools = document.createElement("div");

	tools.className = "b-tools";

	const download = document.createElement("button");
	download.textContent = "Download CSV";

	download.addEventListener("click", function () {
		const link = document.createElement("a");

		link.href = URL.createObjectURL(new Blob([csv()], { type: "text/csv" }));
		link.download = "budget.csv";

		document.body.appendChild(link);
		link.click();
		link.remove();
	});

	tools.appendChild(download);

	if (files) {
		const keep = document.createElement("button");
		keep.textContent = "Save CSV to Files";

		keep.addEventListener("click", function () {
			files.write("root", "budget.csv", new Blob([csv()], { type: "text/csv" })).then(function (node) {
				keep.textContent = "Saved as " + node.name;
			});
		});

		tools.appendChild(keep);
	}

	root.append(top, cards, bars, form, list, tools);

	if (here.length === 0) {
		const none = document.createElement("div");

		none.className = "muted";
		none.textContent = "Nothing this month yet.";

		root.insertBefore(none, list);
	}
}

render();
