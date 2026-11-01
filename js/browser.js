// Browser

// A simple search box: results and websites open in a new browser tab

const browserInput = document.getElementById("browserInput");

const browserEngineButtons = document.querySelectorAll("#browserEngines button");

const searchEngines = {
	google: "https://www.google.com/search?q=",
	duckduckgo: "https://duckduckgo.com/?q=",
	bing: "https://www.bing.com/search?q=",
	brave: "https://search.brave.com/search?q=",
};

let searchEngine = localStorage.getItem("browos-search-engine") || "google";

if (!searchEngines[searchEngine]) {
	searchEngine = "google";
}

function showSearchEngine() {
	browserEngineButtons.forEach(function (button) {
		button.classList.toggle("active", button.dataset.engine === searchEngine);
	});
}

browserEngineButtons.forEach(function (button) {
	button.addEventListener("click", function () {
		searchEngine = button.dataset.engine;

		localStorage.setItem("browos-search-engine", searchEngine);

		showSearchEngine();

		browserInput.focus();
	});
});

showSearchEngine();

// "youtube.com" or "https://..." is an address, anything else is a search

function webAddress(text) {
	if (/\s/.test(text)) {
		return null;
	}

	let value = text;

	if (!/^https?:\/\//i.test(value)) {
		// needs something like name.com

		if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/.*)?$/i.test(value)) {
			return null;
		}

		value = "https://" + value;
	}

	try {
		const url = new URL(value);

		if (url.protocol === "http:" || url.protocol === "https:") {
			return url.href;
		}
	} catch (error) {
		// not an address
	}

	return null;
}

function openBrowserSearch() {
	const text = browserInput.value.trim();

	if (text === "") {
		return;
	}

	const url = webAddress(text) || searchEngines[searchEngine] + encodeURIComponent(text);

	window.open(url, "_blank", "noopener");

	browserInput.value = "";
}

browserInput.addEventListener("keydown", function (event) {
	if (event.key === "Enter") {
		openBrowserSearch();
	}
});

// ready to type as soon as the Browser opens

new MutationObserver(function () {
	if (document.getElementById("browserWindow").classList.contains("show")) {
		browserInput.focus();
	}
}).observe(document.getElementById("browserWindow"), {
	attributes: true,
	attributeFilter: ["class"],
});
