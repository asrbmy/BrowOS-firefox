// Keeps a BrowOS app in step with the desktop theme and accent color.
// Apps run in a frame on the same page origin, so they can read the desktop directly.

(function () {
	let desktop = null;

	try {
		desktop = window.parent !== window ? window.parent : null;

		// touching the parent document throws if it is not the same origin
		void desktop.document.documentElement;
	} catch (error) {
		desktop = null;
	}

	window.browos = desktop && desktop.browosApi ? desktop.browosApi : null;

	if (!desktop) {
		return;
	}

	const desktopRoot = desktop.document.documentElement;

	function sync() {
		const root = document.documentElement;

		root.classList.toggle("light-mode", desktopRoot.classList.contains("light-mode"));

		const accent = desktopRoot.style.getPropertyValue("--accent");

		if (accent) {
			root.style.setProperty("--accent", accent);
		}
	}

	sync();

	new MutationObserver(sync).observe(desktopRoot, {
		attributes: true,
		attributeFilter: ["class", "style"],
	});
})();
