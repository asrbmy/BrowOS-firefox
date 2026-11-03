// Bookmarks: browse and search the browser's bookmarks.
// Reading them needs a permission. It is optional and only asked for when you press the button.

const root = document.getElementById("app");

let tree = [];
let trail = [];
let query = "";

function hasApi() {
	return typeof chrome !== "undefined" && chrome.permissions && chrome.bookmarks;
}

function note(text, buttonText, handler) {
	root.innerHTML = "";

	const box = document.createElement("div");

	box.className = "bk-note";

	const message = document.createElement("div");

	message.className = "muted";
	message.textContent = text;

	box.appendChild(message);

	if (buttonText) {
		const button = document.createElement("button");

		button.className = "primary";
		button.textContent = buttonText;

		button.addEventListener("click", handler);

		box.appendChild(button);
	}

	root.appendChild(box);
}

function granted() {
	return new Promise(function (resolve) {
		// the browser always answers; if it doesn't, don't leave the window blank
		setTimeout(function () {
			resolve(false);
		}, 1500);

		if (typeof chrome === "undefined" || !chrome.permissions) {
			resolve(false);

			return;
		}

		chrome.permissions.contains({ permissions: ["bookmarks"] }, function (yes) {
			resolve(Boolean(yes));
		});
	});
}

function start() {
	if (typeof chrome === "undefined" || !chrome.permissions) {
		note("Bookmarks can only be read when BrowOS runs as a browser extension.");

		return;
	}

	granted().then(function (yes) {
		if (yes) {
			load();
		} else if (!chrome.permissions.request) {
			note("Bookmarks can only be read when BrowOS runs as a browser extension.");
		} else {
			note("To show your bookmarks, BrowOS needs your permission to read them. Nothing leaves your browser.", "Allow access to bookmarks", function () {
				chrome.permissions.request({ permissions: ["bookmarks"] }, function (ok) {
					if (ok) {
						load();
					} else {
						note("Permission wasn't given, so bookmarks stay hidden.", "Try again", start);
					}
				});
			});
		}
	});
}

function load() {
	chrome.bookmarks.getTree(function (result) {
		tree = result || [];

		trail = [];

		render();
	});
}

function folderNodes() {
	let nodes = tree.length ? tree[0].children || [] : [];

	trail.forEach(function (id) {
		const found = nodes.find((n) => n.id === id);

		nodes = found && found.children ? found.children : [];
	});

	return nodes;
}

function flatten(nodes, out, path) {
	nodes.forEach(function (node) {
		if (node.url) {
			out.push({ node: node, path: path });
		} else if (node.children) {
			flatten(node.children, out, path ? path + " / " + node.title : node.title);
		}
	});

	return out;
}

function host(url) {
	try {
		return new URL(url).hostname;
	} catch (error) {
		return "";
	}
}

function render() {
	root.innerHTML = "";

	const bar = document.createElement("div");

	bar.className = "bk-bar";

	const search = document.createElement("input");

	search.type = "search";
	search.placeholder = "Search bookmarks";
	search.value = query;

	search.addEventListener("input", function () {
		query = search.value;

		renderList();
	});

	bar.appendChild(search);

	const path = document.createElement("div");

	path.className = "bk-path";
	path.id = "path";

	const list = document.createElement("div");

	list.className = "bk-list";
	list.id = "list";

	root.append(bar, path, list);

	renderList();
}

function renderList() {
	const list = document.getElementById("list");
	const path = document.getElementById("path");

	list.innerHTML = "";
	path.innerHTML = "";

	let items;

	if (query.trim()) {
		const words = query.toLowerCase().split(/\s+/).filter(Boolean);

		items = flatten(tree, [], "")
			.filter(function (entry) {
				const hay = (entry.node.title + " " + entry.node.url).toLowerCase();

				return words.every((w) => hay.includes(w));
			})
			.slice(0, 200)
			.map(function (entry) {
				return { node: entry.node, hint: entry.path };
			});
	} else {
		const home = document.createElement("button");

		home.textContent = "Bookmarks";

		home.addEventListener("click", function () {
			trail = [];

			renderList();
		});

		path.appendChild(home);

		let nodes = tree.length ? tree[0].children || [] : [];

		trail.forEach(function (id, depth) {
			const found = nodes.find((n) => n.id === id);

			if (found) {
				path.appendChild(document.createTextNode(" › "));

				const crumb = document.createElement("button");

				crumb.textContent = found.title || "Folder";

				crumb.addEventListener("click", function () {
					trail = trail.slice(0, depth + 1);

					renderList();
				});

				path.appendChild(crumb);

				nodes = found.children || [];
			}
		});

		items = folderNodes().map(function (node) {
			return { node: node, hint: "" };
		});
	}

	if (items.length === 0) {
		const empty = document.createElement("div");

		empty.className = "muted";
		empty.style.padding = "20px";
		empty.textContent = query.trim() ? "No bookmarks match." : "This folder is empty.";

		list.appendChild(empty);

		return;
	}

	items.forEach(function (entry) {
		const node = entry.node;

		const row = document.createElement(node.url ? "a" : "button");

		row.className = "bk-item";

		const icon = document.createElement("span");

		icon.textContent = node.url ? "🔖" : "📁";

		const name = document.createElement("span");

		name.textContent = node.title || (node.url ? host(node.url) : "Folder");

		row.append(icon, name);

		if (node.url) {
			row.href = node.url;
			row.target = "_blank";
			row.rel = "noopener noreferrer";

			const small = document.createElement("small");

			small.textContent = entry.hint || host(node.url);

			row.appendChild(small);
		} else {
			row.addEventListener("click", function () {
				trail.push(node.id);

				renderList();
			});
		}

		list.appendChild(row);
	});
}

start();
