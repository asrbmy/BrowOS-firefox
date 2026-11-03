// BrowOS SDK bridge
// Websites running in a window (BrowStore apps) can't touch the desktop directly. With the small
// script in sdk/browos-sdk.js they can ask through postMessage. Each app has to be allowed per
// feature, the first time it asks. Apps that come with BrowOS don't need this, they have the full API.

const SDK_GRANTS_KEY = "browos-sdk-grants";

const SDK_FEATURES = {
	notify: "Show notifications",
	openApp: "Open other apps",
	keepAwake: "Keep the screen from locking or sleeping",
	files: "Save and read files in its own folder (Files / Apps)",
};

function sdkGrants() {
	try {
		return JSON.parse(localStorage.getItem(SDK_GRANTS_KEY)) || {};
	} catch (error) {
		return {};
	}
}

function sdkSaveGrants(grants) {
	localStorage.setItem(SDK_GRANTS_KEY, JSON.stringify(grants));

	document.dispatchEvent(new Event("sdk-grants-changed"));
}

function sdkAppOf(source) {
	const frame = Array.from(document.querySelectorAll(".app-window iframe")).find(function (item) {
		return item.contentWindow === source;
	});

	if (!frame) {
		return null;
	}

	const appWindow = frame.closest(".app-window");

	return { id: appWindow.dataset.appId, name: appWindow.dataset.appName };
}

let sdkAsking = Promise.resolve();

// one question at a time, so a busy app can't bury the person in dialogs
function sdkAllowed(app, feature) {
	const grants = sdkGrants();

	if (grants[app.id] && typeof grants[app.id][feature] === "boolean") {
		return Promise.resolve(grants[app.id][feature]);
	}

	const asked = sdkAsking.then(function () {
		const again = sdkGrants();

		if (again[app.id] && typeof again[app.id][feature] === "boolean") {
			return again[app.id][feature];
		}

		return new Promise(function (resolve) {
			const overlay = document.createElement("div");

			overlay.className = "overlay show";
			overlay.setAttribute("role", "alertdialog");
			overlay.setAttribute("aria-label", "Permission request");

			const box = document.createElement("div");

			box.className = "palette-box sdk-ask";

			const text = document.createElement("div");

			text.textContent = app.name + " wants to: " + SDK_FEATURES[feature].toLowerCase() + ".";

			const row = document.createElement("div");

			row.className = "sdk-ask-row";

			function answer(yes) {
				const next = sdkGrants();

				next[app.id] = Object.assign(next[app.id] || {}, { [feature]: yes });

				sdkSaveGrants(next);

				overlay.remove();

				resolve(yes);
			}

			const allow = document.createElement("button");

			allow.className = "primary";
			allow.textContent = "Allow";

			allow.addEventListener("click", function () {
				answer(true);
			});

			const deny = document.createElement("button");

			deny.textContent = "Don't allow";

			deny.addEventListener("click", function () {
				answer(false);
			});

			row.append(deny, allow);

			box.append(text, row);

			overlay.appendChild(box);

			document.body.appendChild(overlay);

			deny.focus();
		});
	});

	sdkAsking = asked.catch(function () {});

	return asked;
}

function sdkFolder(app) {
	return fileList("root")
		.then(function (items) {
			return items.find((n) => n.type === "folder" && n.name === "Apps") || fileMkdir("root", "Apps");
		})
		.then(function (apps) {
			return fileList(apps.id).then(function (items) {
				return items.find((n) => n.type === "folder" && n.name === app.name) || fileMkdir(apps.id, app.name);
			});
		});
}

const sdkMethods = {
	hello: function () {
		return {
			version: 1,
			theme: document.documentElement.classList.contains("light-mode") ? "light" : "dark",
			accent: document.documentElement.style.getPropertyValue("--accent") || "",
			features: Object.keys(SDK_FEATURES),
		};
	},

	notify: { feature: "notify", run: function (app, args) { notify(String(args[0] || app.name).slice(0, 80), String(args[1] || "").slice(0, 200)); return true; } },

	openApp: { feature: "openApp", run: function (app, args) { return window.browosApi.openApp(String(args[0] || "")); } },

	keepAwake: { feature: "keepAwake", run: function (app, args) { idleKeepAwake("sdk-" + app.id, Boolean(args[0])); return true; } },

	"files.write": {
		feature: "files",
		run: function (app, args) {
			return sdkFolder(app).then(function (folder) {
				return fileList(folder.id).then(function (items) {
					const old = items.find((n) => n.type === "file" && n.name === cleanFileName(args[0]));

					return fileWrite(folder.id, String(args[0]), new Blob([String(args[1] == null ? "" : args[1])], { type: "text/plain" }), old ? { overwriteId: old.id } : undefined);
				});
			}).then(function (node) {
				return node.name;
			});
		},
	},

	"files.read": {
		feature: "files",
		run: function (app, args) {
			return sdkFolder(app).then(function (folder) {
				return fileList(folder.id).then(function (items) {
					const found = items.find((n) => n.type === "file" && n.name === String(args[0]));

					return found ? fileText(found.id) : null;
				});
			});
		},
	},

	"files.list": {
		feature: "files",
		run: function (app) {
			return sdkFolder(app).then((folder) => fileList(folder.id)).then((items) => items.filter((n) => n.type === "file").map((n) => n.name));
		},
	},
};

window.addEventListener("message", function (event) {
	const message = event.data;

	if (!message || message.browos !== 1 || typeof message.id !== "number" || typeof message.method !== "string" || !event.source) {
		return;
	}

	const app = sdkAppOf(event.source);

	function reply(ok, value) {
		try {
			event.source.postMessage({ browos: 1, id: message.id, ok: ok, [ok ? "result" : "error"]: value }, event.origin === "null" ? "*" : event.origin);
		} catch (error) {
			// the app went away
		}
	}

	if (!app) {
		return;
	}

	const method = Object.prototype.hasOwnProperty.call(sdkMethods, message.method) ? sdkMethods[message.method] : null;

	if (!method) {
		reply(false, "Unknown method");

		return;
	}

	if (typeof method === "function") {
		reply(true, method(app, message.args || []));

		return;
	}

	sdkAllowed(app, method.feature).then(function (yes) {
		if (!yes) {
			reply(false, "Permission denied");

			return;
		}

		return Promise.resolve(method.run(app, Array.isArray(message.args) ? message.args : [])).then(
			function (result) {
				reply(true, result === undefined ? null : result);
			},
			function (error) {
				reply(false, error && error.message ? error.message : "Failed");
			}
		);
	});
});
