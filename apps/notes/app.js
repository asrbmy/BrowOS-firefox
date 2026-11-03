// Notes: manage the sticky notes that live on the desktop

const os = window.browos;
const root = document.getElementById("app");

let selected = null;
let query = "";

function api() {
	return os && os.notes ? os.notes : null;
}

function title(note) {
	return note.text.trim().split("\n")[0].slice(0, 60) || "Empty note";
}

function render(keepFocus) {
	const notes = api();

	if (!notes) {
		root.innerHTML = "";

		root.textContent = "The BrowOS desktop isn't reachable from here.";

		return;
	}

	const all = notes.list();

	if (selected && !all.some((n) => n.id === selected)) {
		selected = null;
	}

	if (!selected && all.length) {
		selected = all[0].id;
	}

	const shown = all.filter(function (note) {
		return !query || note.text.toLowerCase().includes(query.toLowerCase());
	});

	const active = document.activeElement;
	const hadSearch = active && active.id === "search";
	const caret = hadSearch ? active.selectionStart : 0;

	root.innerHTML = "";

	// sidebar
	const side = document.createElement("div");

	side.className = "n-side";

	const tools = document.createElement("div");

	tools.className = "n-tools";

	const search = document.createElement("input");

	search.id = "search";
	search.type = "search";
	search.placeholder = "Search notes";
	search.value = query;

	search.addEventListener("input", function () {
		query = search.value;

		render();
	});

	const add = document.createElement("button");

	add.className = "primary";
	add.textContent = "New";

	add.addEventListener("click", function () {
		const id = notes.create("");

		if (id) {
			selected = id;
		}

		render();
	});

	tools.append(search, add);

	const list = document.createElement("div");

	list.className = "n-list";

	shown.forEach(function (note) {
		const item = document.createElement("button");

		item.className = "n-item" + (note.id === selected ? " selected" : "");
		item.style.setProperty("--c", note.color);

		const name = document.createElement("b");

		name.textContent = title(note);

		const rest = document.createElement("small");

		rest.textContent = note.text.trim().split("\n").slice(1).join(" ").slice(0, 60) || " ";

		item.append(name, rest);

		item.addEventListener("click", function () {
			selected = note.id;

			render();
		});

		list.appendChild(item);
	});

	side.append(tools, list);

	// editor
	const edit = document.createElement("div");

	edit.className = "n-edit";

	const note = all.find((n) => n.id === selected);

	if (!note) {
		const empty = document.createElement("div");

		empty.className = "n-empty muted";
		empty.textContent = all.length ? "Pick a note." : "No notes yet. Press New to add one.";

		edit.appendChild(empty);
	} else {
		const row = document.createElement("div");

		row.className = "n-row";

		notes.colors.forEach(function (color) {
			const swatch = document.createElement("button");

			swatch.className = "n-swatch" + (color === note.color ? " on" : "");
			swatch.style.setProperty("--c", color);
			swatch.title = "Color";
			swatch.setAttribute("aria-label", "Color " + color);

			swatch.addEventListener("click", function () {
				notes.update(note.id, { color: color });

				render();
			});

			row.appendChild(swatch);
		});

		const spacer = document.createElement("span");

		spacer.className = "n-spacer";

		const show = document.createElement("button");

		show.textContent = "Show on desktop";

		show.addEventListener("click", function () {
			notes.reveal(note.id);
		});

		const del = document.createElement("button");

		del.textContent = "Delete";

		del.addEventListener("click", function () {
			if (!note.text.trim() || confirm("Delete this note?")) {
				notes.remove(note.id);

				selected = null;

				render();
			}
		});

		row.append(spacer, show, del);

		const area = document.createElement("textarea");

		area.value = note.text;
		area.maxLength = 5000;
		area.placeholder = "Write something...";

		area.addEventListener("input", function () {
			notes.update(note.id, { text: area.value });

			// the title in the list follows the text
			const row = list.querySelector(".n-item.selected");

			if (row) {
				row.querySelector("b").textContent = title({ text: area.value });
				row.querySelector("small").textContent = area.value.trim().split("\n").slice(1).join(" ").slice(0, 60) || " ";
			}
		});

		edit.append(row, area);

		if (keepFocus === "text") {
			setTimeout(function () {
				area.focus();
			}, 0);
		}
	}

	root.append(side, edit);

	if (hadSearch) {
		const again = document.getElementById("search");

		again.focus();
		again.setSelectionRange(caret, caret);
	}
}

if (window.parent !== window) {
	// a note was changed on the desktop (not by this app)
	window.parent.document.addEventListener("notes-changed", function () {
		const focused = document.activeElement;

		// don't rebuild while typing here
		if (!focused || focused.tagName !== "TEXTAREA") {
			render();
		}
	});
}

render();
