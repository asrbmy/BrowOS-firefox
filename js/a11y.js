// Accessibility: roles and names for the parts of the desktop, keyboard use for menus and icons,
// and a switch to reduce motion.

const REDUCE_MOTION_KEY = "browos-reduce-motion";

function applyReduceMotion() {
	const setting = localStorage.getItem(REDUCE_MOTION_KEY);

	const on = setting === "on" || (setting !== "off" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

	document.documentElement.classList.toggle("reduce-motion", on);
}

applyReduceMotion();

function describeWindow(appWindow) {
	if (appWindow.dataset.a11y) {
		return;
	}

	appWindow.dataset.a11y = "1";

	appWindow.setAttribute("role", "dialog");

	const title = appWindow.dataset.appName || (appWindow.querySelector(".app-title, h3") || {}).textContent;

	if (title) {
		appWindow.setAttribute("aria-label", title);
	}
}

// the matches inside root, and root itself when it is one
function within(root, selector) {
	const list = Array.from(root.querySelectorAll(selector));

	if (root.matches && root.matches(selector)) {
		list.unshift(root);
	}

	return list;
}

function describeButtons(root) {
	within(root, "[data-taskbar-app], .taskbar button").forEach(function (button) {
		if (!button.getAttribute("aria-label") && !button.textContent.trim()) {
			const label = button.title || button.dataset.name || button.querySelector("img[alt]")?.alt;

			if (label) {
				button.setAttribute("aria-label", label);
			}
		}
	});

	within(root, ".window-controls button, .app-controls button").forEach(function (button) {
		if (!button.getAttribute("aria-label") && button.title) {
			button.setAttribute("aria-label", button.title);
		}
	});

	within(root, ".menu-item, .tile, .desktop-icon").forEach(function (item) {
		if (!item.hasAttribute("tabindex")) {
			item.setAttribute("tabindex", "0");
		}

		if (!item.getAttribute("role")) {
			item.setAttribute("role", item.classList.contains("menu-item") ? "menuitem" : "button");
		}

		if (!item.getAttribute("aria-label") && item.classList.contains("desktop-icon")) {
			item.setAttribute("aria-label", item.textContent.trim());
		}
	});

	within(root, ".start-menu").forEach(function (menu) {
		menu.setAttribute("role", "menu");
		menu.setAttribute("aria-label", "Start menu");
	});

	within(root, ".taskbar").forEach(function (bar) {
		bar.setAttribute("role", "toolbar");
		bar.setAttribute("aria-label", "Taskbar");
	});

	within(root, ".app-window").forEach(describeWindow);
}

describeButtons(document);

new MutationObserver(function (mutations) {
	for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
			if (node.nodeType === 1) {
				describeButtons(node);

				if (node.matches && node.matches(".app-window")) {
					describeWindow(node);
				}
			}
		}
	}
}).observe(document.body, { childList: true, subtree: true });

// Enter or Space does what a click does, on things that are not real buttons
document.addEventListener("keydown", function (event) {
	if ((event.key === "Enter" || event.key === " ") && event.target.matches && event.target.matches(".menu-item, .tile, .desktop-icon, .settings-nav, .wallpaper-option")) {
		event.preventDefault();

		// icons open with a double click
		event.target.dispatchEvent(new MouseEvent(event.target.matches(".desktop-icon") ? "dblclick" : "click", { bubbles: true }));
	}
});

// a window opened with the keyboard keeps the keyboard
document.addEventListener("keydown", function (event) {
	if (event.key === "F6") {
		event.preventDefault();

		// moves between the taskbar and the window in front
		const bar = document.querySelector(".taskbar button");

		const front = typeof frontWindow === "function" ? frontWindow() : null;

		if (front && !front.contains(document.activeElement)) {
			focusAppFrame(front);
		} else if (bar) {
			bar.focus();
		}
	}
});
