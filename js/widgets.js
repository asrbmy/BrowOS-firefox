// Desktop widgets and sticky notes

const widgetLayer = document.getElementById("widgetLayer");

const WIDGETS_KEY = "browos-widgets";
const NOTES_KEY = "browos-notes";
const MAX_NOTES = 30;

const NOTE_COLORS = ["#ffe066", "#ffadad", "#b9fbc0", "#a0c4ff", "#d7b8ff"];

// Dragging

function makeDraggable(element, handle, onDone) {
	let dragging = false;
	let offsetX = 0;
	let offsetY = 0;

	handle.addEventListener("pointerdown", function (event) {
		if (event.button !== 0 || event.target.closest("button, input, textarea")) {
			return;
		}

		dragging = true;

		const rect = element.getBoundingClientRect();

		offsetX = event.clientX - rect.left;
		offsetY = event.clientY - rect.top;

		handle.setPointerCapture(event.pointerId);

		element.classList.add("dragging");
	});

	handle.addEventListener("pointermove", function (event) {
		if (!dragging) {
			return;
		}

		const maxX = window.innerWidth - element.offsetWidth;
		const maxY = window.innerHeight - 100 - element.offsetHeight;

		element.style.left = Math.max(0, Math.min(maxX, event.clientX - offsetX)) + "px";
		element.style.top = Math.max(0, Math.min(maxY, event.clientY - offsetY)) + "px";
	});

	function stop(event) {
		if (!dragging) {
			return;
		}

		dragging = false;

		element.classList.remove("dragging");

		if (handle.hasPointerCapture(event.pointerId)) {
			handle.releasePointerCapture(event.pointerId);
		}

		onDone(parseInt(element.style.left), parseInt(element.style.top));
	}

	handle.addEventListener("pointerup", stop);
	handle.addEventListener("pointercancel", stop);
}

// Sticky notes

let notes = [];

try {
	const saved = JSON.parse(localStorage.getItem(NOTES_KEY));

	if (Array.isArray(saved)) {
		notes = saved.filter(function (note) {
			return note && typeof note.id === "string";
		});
	}
} catch (error) {
	notes = [];
}

function saveNotes() {
	try {
		localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
	} catch (error) {
		notify("Sticky notes", "Couldn't save your notes: the browser storage is full.", {
			important: true,
		});
	}

	document.dispatchEvent(new Event("notes-changed"));
}

function renderNote(note) {
	const element = document.createElement("div");

	element.className = "sticky-note";
	element.dataset.noteId = note.id;

	element.style.left = note.x + "px";
	element.style.top = note.y + "px";
	element.style.width = note.w + "px";
	element.style.height = note.h + "px";
	element.style.setProperty("--note", note.color);

	const header = document.createElement("div");

	header.className = "sticky-header";

	const colorButton = document.createElement("button");

	colorButton.className = "sticky-color";
	colorButton.title = "Change color";
	colorButton.textContent = "●";

	colorButton.addEventListener("click", function () {
		const next = (NOTE_COLORS.indexOf(note.color) + 1) % NOTE_COLORS.length;

		note.color = NOTE_COLORS[next];

		element.style.setProperty("--note", note.color);

		saveNotes();
	});

	const closeButton = document.createElement("button");

	closeButton.className = "sticky-close";
	closeButton.title = "Delete note";
	closeButton.textContent = "×";

	closeButton.addEventListener("click", function () {
		if (note.text.trim() && !confirm("Delete this note?")) {
			return;
		}

		notes = notes.filter(function (other) {
			return other !== note;
		});

		element.remove();

		saveNotes();
	});

	header.append(colorButton, closeButton);

	const text = document.createElement("textarea");

	text.value = note.text;
	text.placeholder = "Write something...";
	text.spellcheck = false;
	text.maxLength = 5000;

	text.addEventListener("input", function () {
		note.text = text.value;

		saveNotes();
	});

	element.append(header, text);

	widgetLayer.appendChild(element);

	makeDraggable(element, header, function (x, y) {
		note.x = x;
		note.y = y;

		saveNotes();
	});

	// remember the size after the user drags the corner
	let ready = false;

	let resizeTimer = null;

	new ResizeObserver(function () {
		// the first call comes when the note is added
		if (!ready) {
			ready = true;

			return;
		}

		clearTimeout(resizeTimer);

		resizeTimer = setTimeout(function () {
			note.w = element.offsetWidth;
			note.h = element.offsetHeight;

			saveNotes();
		}, 400);
	}).observe(element);

	return text;
}

function createStickyNote(initialText) {
	if (notes.length >= MAX_NOTES) {
		notify("Sticky notes", "That's the most notes there can be (" + MAX_NOTES + ").");

		return;
	}

	const offset = (notes.length % 6) * 28;

	const note = {
		id: "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
		x: Math.min(180 + offset, Math.max(0, window.innerWidth - 220)),
		y: 80 + offset,
		w: 200,
		h: 190,
		color: NOTE_COLORS[notes.length % NOTE_COLORS.length],
		text: String(initialText || ""),
	};

	notes.push(note);

	saveNotes();

	const field = renderNote(note);

	if (!initialText) {
		field.focus();
	}
}

notes.forEach(renderNote);

// Other widgets

let widgetSettings = {};

try {
	widgetSettings = JSON.parse(localStorage.getItem(WIDGETS_KEY)) || {};
} catch (error) {
	widgetSettings = {};
}

function saveWidgetSettings() {
	localStorage.setItem(WIDGETS_KEY, JSON.stringify(widgetSettings));
}

const QUOTES = [
	["The journey of a thousand miles begins with a single step.", "Lao Tzu"],
	["It does not matter how slowly you go as long as you do not stop.", "Confucius"],
	["We are what we repeatedly do.", "Will Durant, on Aristotle"],
	["Well begun is half done.", "Aristotle"],
	["Nothing great was ever achieved without enthusiasm.", "Ralph Waldo Emerson"],
	["The best way out is always through.", "Robert Frost"],
	["Do what you can, with what you have, where you are.", "Theodore Roosevelt"],
	["A person who never made a mistake never tried anything new.", "Albert Einstein"],
	["Lost time is never found again.", "Benjamin Franklin"],
	["The only way to do great work is to love what you do.", "Steve Jobs"],
	["Fall seven times, stand up eight.", "Japanese proverb"],
	["Slow and steady wins the race.", "Aesop"],
	["What we think, we become.", "Buddha"],
	["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
	["Action is the foundational key to all success.", "Pablo Picasso"],
	["The secret of getting ahead is getting started.", "Mark Twain"],
];

function dayNumber() {
	const now = new Date();

	return Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000);
}

// each builder fills the widget body and returns a function that stops its timers
const widgetBuilders = {
	clock: {
		title: "Clock",
		build: function (body) {
			const time = document.createElement("div");

			time.className = "widget-big";

			const date = document.createElement("div");

			date.className = "widget-small";

			body.append(time, date);

			function update() {
				const now = new Date();

				time.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

				date.textContent = now.toLocaleDateString([], {
					weekday: "long",
					day: "numeric",
					month: "long",
				});
			}

			update();

			const timer = setInterval(update, 1000);

			return function () {
				clearInterval(timer);
			};
		},
	},

	calendar: {
		title: "Calendar",
		build: function (body) {
			let shown = new Date();

			shown.setDate(1);

			const bar = document.createElement("div");

			bar.className = "calendar-bar";

			const previous = document.createElement("button");

			previous.textContent = "‹";
			previous.title = "Previous month";

			const label = document.createElement("span");

			const next = document.createElement("button");

			next.textContent = "›";
			next.title = "Next month";

			bar.append(previous, label, next);

			const grid = document.createElement("div");

			grid.className = "calendar-grid";

			body.append(bar, grid);

			function draw() {
				label.textContent = shown.toLocaleDateString([], { month: "long", year: "numeric" });

				grid.innerHTML = "";

				// weekday letters, starting from the browser's idea of Sunday
				for (let day = 0; day < 7; day++) {
					const head = document.createElement("span");

					head.className = "calendar-head";

					head.textContent = new Date(2023, 0, 1 + day)
						.toLocaleDateString([], { weekday: "narrow" });

					grid.appendChild(head);
				}

				const first = new Date(shown.getFullYear(), shown.getMonth(), 1).getDay();

				const length = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();

				for (let blank = 0; blank < first; blank++) {
					grid.appendChild(document.createElement("span"));
				}

				const today = new Date();

				for (let day = 1; day <= length; day++) {
					const cell = document.createElement("span");

					cell.textContent = day;

					if (
						day === today.getDate() &&
						shown.getMonth() === today.getMonth() &&
						shown.getFullYear() === today.getFullYear()
					) {
						cell.className = "calendar-today";
					}

					grid.appendChild(cell);
				}
			}

			previous.addEventListener("click", function () {
				shown = new Date(shown.getFullYear(), shown.getMonth() - 1, 1);

				draw();
			});

			next.addEventListener("click", function () {
				shown = new Date(shown.getFullYear(), shown.getMonth() + 1, 1);

				draw();
			});

			draw();

			return function () {};
		},
	},

	quote: {
		title: "Quote",
		build: function (body) {
			let index = dayNumber() % QUOTES.length;

			const text = document.createElement("div");

			text.className = "quote-text";

			const author = document.createElement("div");

			author.className = "widget-small";

			const again = document.createElement("button");

			again.className = "widget-link";
			again.textContent = "Another one";

			body.append(text, author, again);

			function draw() {
				text.textContent = "“" + QUOTES[index][0] + "”";

				author.textContent = QUOTES[index][1];
			}

			again.addEventListener("click", function () {
				index = (index + 1) % QUOTES.length;

				draw();
			});

			draw();

			return function () {};
		},
	},

	weather: {
		title: "Weather",
		build: function (body) {
			const content = document.createElement("div");

			body.appendChild(content);

			let stopped = false;

			function message(text, buttonText) {
				content.innerHTML = "";

				const line = document.createElement("div");

				line.className = "widget-small";

				line.textContent = text;

				content.appendChild(line);

				if (buttonText) {
					const button = document.createElement("button");

					button.className = "widget-link";
					button.textContent = buttonText;

					button.addEventListener("click", function () {
						launchApp("weather");
					});

					content.appendChild(button);
				}
			}

			async function refresh() {
				const place = BrowWeather.getPlace();

				if (!place) {
					message("No city chosen yet.", "Choose a city");

					return;
				}

				try {
					const data = await BrowWeather.forecast(place);

					if (stopped) {
						return;
					}

					const unit = BrowWeather.getUnit();

					const info = BrowWeather.describe(data.current.weather_code);

					content.innerHTML = "";

					const top = document.createElement("div");

					top.className = "weather-widget-top";

					const icon = document.createElement("span");

					icon.className = "weather-widget-icon";
					icon.textContent = info[1];

					const temperature = document.createElement("span");

					temperature.className = "widget-big";
					temperature.textContent = BrowWeather.temperature(data.current.temperature_2m, unit);

					top.append(icon, temperature);

					const detail = document.createElement("div");

					detail.className = "widget-small";
					detail.textContent =
						place.name +
						" · " +
						info[0] +
						" · " +
						BrowWeather.temperature(data.daily.temperature_2m_min[0], unit) +
						" / " +
						BrowWeather.temperature(data.daily.temperature_2m_max[0], unit);

					content.append(top, detail);
				} catch (error) {
					if (!stopped) {
						message("Couldn't load the weather right now.");
					}
				}
			}

			message("Loading...");

			refresh();

			const timer = setInterval(refresh, 30 * 60000);

			// the Weather app changed the city or the unit
			function changed(event) {
				if (event.key === "browos-weather-place" || event.key === "browos-weather-unit") {
					refresh();
				}
			}

			window.addEventListener("storage", changed);

			return function () {
				stopped = true;

				clearInterval(timer);

				window.removeEventListener("storage", changed);
			};
		},
	},

	system: {
		title: "System",
		build: function (body) {
			const list = document.createElement("div");

			list.className = "system-list";

			body.appendChild(list);

			let battery = null;

			if (navigator.getBattery) {
				navigator
					.getBattery()
					.then(function (result) {
						battery = result;

						update();
					})
					.catch(function () {});
			}

			let memory = "";

			function readMemory() {
				try {
					if (chrome.system && chrome.system.memory) {
						chrome.system.memory.getInfo(function (info) {
							if (info && info.capacity) {
								const used = info.capacity - info.availableCapacity;

								memory = Math.round((used / info.capacity) * 100) + "% of " + (info.capacity / 1073741824).toFixed(1) + " GB";
							}
						});
					}
				} catch (error) {
					// not available here
				}
			}

			function row(name, value) {
				const line = document.createElement("div");

				line.className = "system-row";

				const label = document.createElement("span");

				label.textContent = name;

				const data = document.createElement("span");

				data.textContent = value;

				line.append(label, data);

				list.appendChild(line);
			}

			function update() {
				readMemory();

				list.innerHTML = "";

				if (battery) {
					row(
						"Battery",
						Math.round(battery.level * 100) + "%" + (battery.charging ? " (charging)" : "")
					);
				}

				if (memory) {
					row("Memory", memory);
				}

				row("Network", navigator.onLine ? "Online" : "Offline");

				row("Apps open", String(document.querySelectorAll(".app-window[data-running]").length));
			}

			update();

			const timer = setInterval(update, 8000);

			return function () {
				clearInterval(timer);
			};
		},
	},
};

const WIDGET_ORDER = ["clock", "calendar", "weather", "quote", "system"];

const activeWidgets = {};

function defaultWidgetSpot(id) {
	// a column on the right, in a fixed order
	const column = window.innerWidth - 270;

	let top = 24;

	WIDGET_ORDER.forEach(function (other) {
		if (WIDGET_ORDER.indexOf(other) < WIDGET_ORDER.indexOf(id) && widgetSettings[other] && widgetSettings[other].on) {
			top += (activeWidgets[other] ? activeWidgets[other].element.offsetHeight : 120) + 12;
		}
	});

	return { x: Math.max(0, column), y: top };
}

function showWidget(id) {
	if (activeWidgets[id]) {
		return;
	}

	const builder = widgetBuilders[id];

	const element = document.createElement("div");

	element.className = "widget widget-" + id;

	const header = document.createElement("div");

	header.className = "widget-header";
	header.textContent = builder.title;

	const body = document.createElement("div");

	body.className = "widget-body";

	element.append(header, body);

	widgetLayer.appendChild(element);

	const stop = builder.build(body);

	const saved = widgetSettings[id];

	let spot;

	if (saved && typeof saved.x === "number" && typeof saved.y === "number") {
		spot = {
			x: Math.min(saved.x, Math.max(0, window.innerWidth - element.offsetWidth)),
			y: Math.min(saved.y, Math.max(0, window.innerHeight - 100 - element.offsetHeight)),
		};
	} else {
		spot = defaultWidgetSpot(id);
	}

	element.style.left = spot.x + "px";
	element.style.top = spot.y + "px";

	makeDraggable(element, header, function (x, y) {
		widgetSettings[id].x = x;
		widgetSettings[id].y = y;

		saveWidgetSettings();
	});

	activeWidgets[id] = { element: element, stop: stop };
}

function hideWidget(id) {
	if (!activeWidgets[id]) {
		return;
	}

	activeWidgets[id].stop();

	activeWidgets[id].element.remove();

	delete activeWidgets[id];
}

function setWidget(id, on) {
	widgetSettings[id] = widgetSettings[id] || {};

	widgetSettings[id].on = on;

	saveWidgetSettings();

	if (on) {
		showWidget(id);
	} else {
		hideWidget(id);
	}
}

WIDGET_ORDER.forEach(function (id) {
	if (widgetSettings[id] && widgetSettings[id].on) {
		showWidget(id);
	}
});

// Settings: Widgets page

WIDGET_ORDER.forEach(function (id) {
	const toggle = document.getElementById("widget-" + id);

	toggle.checked = Boolean(widgetSettings[id] && widgetSettings[id].on);

	toggle.addEventListener("change", function () {
		setWidget(id, toggle.checked);
	});
});

const notesCount = document.getElementById("notesCount");

function showNotesCount() {
	notesCount.textContent = notes.length + (notes.length === 1 ? " note" : " notes");
}

document.addEventListener("notes-changed", showNotesCount);

showNotesCount();

document.getElementById("newNoteButton").addEventListener("click", function () {
	createStickyNote("");
});

document.getElementById("clearNotesButton").addEventListener("click", function () {
	if (notes.length === 0 || !confirm("Delete all " + notes.length + " sticky notes? This can't be undone.")) {
		return;
	}

	notes = [];

	widgetLayer.querySelectorAll(".sticky-note").forEach(function (element) {
		element.remove();
	});

	saveNotes();
});

// the window got smaller: bring widgets and notes back into view

window.addEventListener("resize", function () {
	widgetLayer.querySelectorAll(".widget, .sticky-note").forEach(function (element) {
		const maxX = Math.max(0, window.innerWidth - element.offsetWidth);
		const maxY = Math.max(0, window.innerHeight - 100 - element.offsetHeight);

		element.style.left = Math.min(parseInt(element.style.left) || 0, maxX) + "px";
		element.style.top = Math.min(parseInt(element.style.top) || 0, maxY) + "px";
	});
});

// What the Notes app can do with the sticky notes on the desktop

function noteElement(id) {
	return Array.from(widgetLayer.querySelectorAll(".sticky-note")).find(function (element) {
		return element.dataset.noteId === id;
	});
}

const noteTools = {
	colors: NOTE_COLORS,

	list: function () {
		return notes.map(function (note) {
			return { id: note.id, text: note.text, color: note.color };
		});
	},

	create: function (text) {
		createStickyNote(text || "");

		return notes.length ? notes[notes.length - 1].id : null;
	},

	update: function (id, patch) {
		const note = notes.find(function (item) {
			return item.id === id;
		});

		const element = noteElement(id);

		if (!note) {
			return false;
		}

		if (typeof patch.text === "string") {
			note.text = patch.text.slice(0, 5000);

			if (element) {
				element.querySelector("textarea").value = note.text;
			}
		}

		if (NOTE_COLORS.includes(patch.color)) {
			note.color = patch.color;

			if (element) {
				element.style.setProperty("--note", note.color);
			}
		}

		saveNotes();

		return true;
	},

	remove: function (id) {
		const element = noteElement(id);

		notes = notes.filter(function (note) {
			return note.id !== id;
		});

		if (element) {
			element.remove();
		}

		saveNotes();
	},

	// bring the note into view on the desktop
	reveal: function (id) {
		const element = noteElement(id);

		if (!element) {
			return;
		}

		element.style.zIndex = 60;

		element.classList.add("note-flash");

		setTimeout(function () {
			element.classList.remove("note-flash");
		}, 1200);
	},
};
