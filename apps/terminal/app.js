// Terminal: a small command line for BrowOS.
// It is not a real shell. It only talks to the BrowOS desktop through window.browos.

const term = document.getElementById("term");
const output = document.getElementById("output");
const input = document.getElementById("input");

const MAX_LINES = 500;

const history = [];
let historyPosition = 0;

function print(text, kind) {
	const line = document.createElement("div");

	if (kind) {
		line.className = kind;
	}

	line.textContent = text;

	output.appendChild(line);

	while (output.childElementCount > MAX_LINES) {
		output.firstElementChild.remove();
	}

	output.scrollTop = output.scrollHeight;
}

function os() {
	if (!window.browos) {
		print("This command needs the BrowOS desktop, which isn't reachable here.", "err");

		return null;
	}

	return window.browos;
}

// The calculator (safeCalculate) is shared with the desktop: js/calc.js

// To-do list shared with the To-Do app

function readTodos() {
	try {
		const saved = JSON.parse(localStorage.getItem("browos-todo"));

		return Array.isArray(saved) ? saved : [];
	} catch (error) {
		return [];
	}
}

const commands = {
	help: {
		about: "show this list",
		run: function () {
			print("Commands:", "accent");

			Object.keys(commands)
				.sort()
				.forEach(function (name) {
					print("  " + name.padEnd(12) + commands[name].about);
				});

			print("Tip: Tab completes commands and app names, the arrow keys bring back old commands.", "dim");
		},
	},

	clear: {
		about: "clear the screen",
		run: function () {
			output.innerHTML = "";
		},
	},

	echo: {
		about: "print some text",
		run: function (args) {
			print(args.join(" "));
		},
	},

	date: {
		about: "show the date and time",
		run: function () {
			print(new Date().toLocaleString([], { dateStyle: "full", timeStyle: "medium" }));
		},
	},

	whoami: {
		about: "show who you are",
		run: function () {
			print("browos");
		},
	},

	uname: {
		about: "show the system name",
		run: function () {
			print("BrowOS (runs inside " + (navigator.userAgentData && navigator.userAgentData.brands
				? navigator.userAgentData.brands.map(function (brand) { return brand.brand; }).filter(function (name) { return !/Not.*Brand/i.test(name); }).join(" / ")
				: "your browser") + ")");
		},
	},

	neofetch: {
		about: "show a system summary",
		run: function () {
			const api = os();

			if (!api) {
				return;
			}

			const info = api.systemInfo();

			print("BrowOS", "accent");
			print("-------");
			print("Theme:      " + info.theme);
			print("Apps:       " + info.installed + " installed, " + info.running + " running");
			print("Desktop:    " + info.desktop + " of " + info.desktops);
			print("Screen:     " + info.screen);
			print("Language:   " + info.language);
			print("Online:     " + (info.online ? "yes" : "no"));
		},
	},

	ls: {
		about: "list the installed apps",
		run: function () {
			const api = os();

			if (!api) {
				return;
			}

			api.listApps()
				.filter(function (app) {
					return app.installed;
				})
				.forEach(function (app) {
					print(app.id.padEnd(14) + app.name);
				});
		},
	},

	ps: {
		about: "list the running apps",
		run: function () {
			const api = os();

			if (!api) {
				return;
			}

			const running = api.runningApps();

			if (running.length === 0) {
				print("Nothing is running.", "dim");

				return;
			}

			running.forEach(function (app) {
				print(app.id.padEnd(14) + app.name + (app.visible ? "" : "  (minimized)"));
			});
		},
	},

	open: {
		about: "open an app: open notepad",
		run: function (args) {
			const api = os();

			if (!api) {
				return;
			}

			if (args.length === 0) {
				print("Usage: open <app name>", "err");

				return;
			}

			const opened = api.openApp(args.join(" "));

			print(opened ? "Opened " + opened + "." : "No installed app called '" + args.join(" ") + "'.", opened ? "" : "err");
		},
	},

	close: {
		about: "close an app: close notepad",
		run: function (args) {
			const api = os();

			if (!api) {
				return;
			}

			if (args.length === 0) {
				print("Usage: close <app name>", "err");

				return;
			}

			const closed = api.closeApp(args.join(" "));

			print(closed ? "Closed " + closed + "." : "No running app called '" + args.join(" ") + "'.", closed ? "" : "err");
		},
	},

	theme: {
		about: "theme dark | light",
		run: function (args) {
			const api = os();

			if (!api) {
				return;
			}

			if (args[0] !== "dark" && args[0] !== "light") {
				print("Usage: theme dark | light", "err");

				return;
			}

			api.setTheme(args[0]);

			print("Theme set to " + args[0] + ".");
		},
	},

	accent: {
		about: "accent #rrggbb (or a color name)",
		run: function (args) {
			const api = os();

			if (!api) {
				return;
			}

			if (!args[0] || !api.setAccent(args[0])) {
				print("Usage: accent #2196f3  (or a color name like orange)", "err");

				return;
			}

			print("Accent color changed.");
		},
	},

	wallpaper: {
		about: "wallpaper next",
		run: function (args) {
			const api = os();

			if (!api) {
				return;
			}

			if (args[0] !== "next") {
				print("Usage: wallpaper next", "err");

				return;
			}

			api.nextWallpaper();

			print("Wallpaper changed.");
		},
	},

	notify: {
		about: "show a notification: notify Hello",
		run: function (args) {
			const api = os();

			if (!api) {
				return;
			}

			if (args.length === 0) {
				print("Usage: notify <text>", "err");

				return;
			}

			api.notify("Terminal", args.join(" "));
		},
	},

	note: {
		about: "add a sticky note to the desktop: note Buy milk",
		run: function (args) {
			const api = os();

			if (!api) {
				return;
			}

			api.newNote(args.join(" "));

			print("Sticky note added to the desktop.");
		},
	},

	todo: {
		about: "todo add <task> | todo list",
		run: function (args) {
			const action = args[0];

			const tasks = readTodos();

			if (action === "add" && args.length > 1) {
				tasks.unshift({ text: args.slice(1).join(" "), done: false, due: "" });

				localStorage.setItem("browos-todo", JSON.stringify(tasks));

				print("Task added.");

				return;
			}

			if (action === "list") {
				if (tasks.length === 0) {
					print("No tasks.", "dim");
				}

				tasks.forEach(function (task, position) {
					print((task.done ? "[x] " : "[ ] ") + (position + 1) + ". " + task.text);
				});

				return;
			}

			print("Usage: todo add <task> | todo list", "err");
		},
	},

	calc: {
		about: "calculate: calc (2 + 3) * 4",
		run: function (args) {
			if (args.length === 0) {
				print("Usage: calc <expression>", "err");

				return;
			}

			try {
				const result = safeCalculate(args.join(" "));

				print(Number.isFinite(result) ? String(result) : "Not a number (check for dividing by zero)", Number.isFinite(result) ? "" : "err");
			} catch (error) {
				print(error.message, "err");
			}
		},
	},

	search: {
		about: "search the web in a new tab",
		run: function (args) {
			if (args.length === 0) {
				print("Usage: search <words>", "err");

				return;
			}

			window.open(
				"https://www.google.com/search?q=" + encodeURIComponent(args.join(" ")),
				"_blank",
				"noopener"
			);
		},
	},

	lock: {
		about: "lock the screen",
		run: function () {
			const api = os();

			if (api) {
				api.lock();
			}
		},
	},

	screensaver: {
		about: "start the screensaver",
		run: function () {
			const api = os();

			if (api) {
				api.screensaver();
			}
		},
	},

	history: {
		about: "show the commands you typed",
		run: function () {
			history.forEach(function (line, position) {
				print(String(position + 1).padStart(3) + "  " + line);
			});
		},
	},
};

function runLine(line) {
	print("browos@desktop:~$ " + line, "cmd");

	const words = line.trim().split(/\s+/);

	const name = words.shift().toLowerCase();

	if (!commands[name]) {
		print("Command not found: " + name + ". Type 'help' to see what you can do.", "err");

		return;
	}

	try {
		commands[name].run(words);
	} catch (error) {
		print("Something went wrong: " + error.message, "err");
	}
}

input.addEventListener("keydown", function (event) {
	if (event.key === "Enter") {
		const line = input.value.trim();

		input.value = "";

		if (!line) {
			return;
		}

		if (history[history.length - 1] !== line) {
			history.push(line);
		}

		historyPosition = history.length;

		runLine(line);

		return;
	}

	if (event.key === "ArrowUp") {
		event.preventDefault();

		if (historyPosition > 0) {
			historyPosition--;

			input.value = history[historyPosition];
		}

		return;
	}

	if (event.key === "ArrowDown") {
		event.preventDefault();

		if (historyPosition < history.length - 1) {
			historyPosition++;

			input.value = history[historyPosition];
		} else {
			historyPosition = history.length;

			input.value = "";
		}

		return;
	}

	if (event.key === "Tab") {
		event.preventDefault();

		const parts = input.value.split(/\s+/);

		const last = parts[parts.length - 1].toLowerCase();

		if (!last) {
			return;
		}

		let options;

		if (parts.length === 1) {
			options = Object.keys(commands);
		} else if (window.browos && ["open", "close"].includes(parts[0].toLowerCase())) {
			options = window.browos.listApps().map(function (app) {
				return app.id;
			});
		} else {
			return;
		}

		const matches = options.filter(function (option) {
			return option.startsWith(last);
		});

		if (matches.length === 1) {
			parts[parts.length - 1] = matches[0];

			input.value = parts.join(" ") + " ";
		} else if (matches.length > 1) {
			print(matches.join("   "), "dim");
		}
	}
});

// clicking anywhere in the terminal goes back to typing

term.addEventListener("click", function () {
	if (!window.getSelection().toString()) {
		input.focus();
	}
});

window.addEventListener("focus", function () {
	input.focus();
});

print("BrowOS Terminal", "accent");
print("Type 'help' to see the commands.", "dim");

input.focus();
