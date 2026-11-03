// Frame hooks

// Keyboard and mouse events inside an app's frame never reach the desktop page.
// Features that need to see them (shortcuts, idle detection) register here, and the
// callback runs for the desktop and for every app frame that is on the same origin.
// Websites loaded from the internet are cross-origin, so nothing can be hooked there.

const hookedDocuments = new WeakSet();

const documentHooks = [];

function hookDocument(doc) {
	if (!doc || hookedDocuments.has(doc)) {
		return;
	}

	hookedDocuments.add(doc);

	documentHooks.forEach(function (hook) {
		hook(doc);
	});
}

function sameOriginDocument(frame) {
	try {
		// reading this throws for another origin
		return frame.contentDocument || null;
	} catch (error) {
		return null;
	}
}

function scanFrames() {
	document.querySelectorAll("iframe").forEach(function (frame) {
		const doc = sameOriginDocument(frame);

		// "about:blank" is the document before the app has loaded
		if (doc && doc.readyState !== "uninitialized" && doc.URL !== "about:blank") {
			hookDocument(doc);
		}
	});
}

// runs the callback now for the desktop and later for every frame that appears
function onEveryDocument(callback) {
	documentHooks.push(callback);

	hookedDocuments.has(document) ? callback(document) : hookDocument(document);

	// documents that were hooked before this callback was registered
	document.querySelectorAll("iframe").forEach(function (frame) {
		const doc = sameOriginDocument(frame);

		if (doc && hookedDocuments.has(doc)) {
			callback(doc);
		}
	});
}

// frames load when an app is opened for the first time, and they can navigate later
document.addEventListener(
	"load",
	function (event) {
		if (event.target && event.target.tagName === "IFRAME") {
			scanFrames();
		}
	},
	true
);

setInterval(scanFrames, 3000);
