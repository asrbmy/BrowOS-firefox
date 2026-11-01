// BrowOS apps

// Every app BrowOS knows about.
// Only real facts go here: name, where it runs, its official website and source.
// Descriptions and developer info are never written here, BrowStore loads them
// from the official page or the official GitHub API when the user opens the details.

function siteIcon(host) {
	return "https://www.google.com/s2/favicons?domain=" + host + "&sz=64";
}

const appCatalog = [
	// built into BrowOS

	{
		id: "notepad",
		name: "Notepad",
		category: "apps",
		builtIn: true,
		icon: "icons/notepad-icon.png",
		window: "notepadWindow",
		officialPage: "apps/notepad/index.html",
		github: "amitmerchant1990/notepad",
		website: "https://notepad.js.org",
		credit: "Notepad by Amit Merchant",
		license: "MIT License",
		dataKeys: [
			"note",
			"mode",
			"selectedFont",
			"dyslexicFont",
			"monospaced",
			"serifFont",
			"timerChime",
			"isUserPreferredTheme",
			"hasUserDismissedDonationPopup",
			"userChosenBreakReminders",
			"userChosenExplodingEffect",
			"userChosenFontSize",
			"userChosenFontWeight",
			"userChosenLineHeight",
			"userChosenOptimalLineLengthSelected",
			"userChosenSpellCheck",
			"userChosenTabIndentation",
			"userChosenTexture",
			"userChosenTransparentWordCountPillSelected",
			"userChosenTypewriterSound",
			"userChosenTypewriterVolume",
			"userChosenWordCountPillSelected",
			"userChosenWriteDirection",
			"recentUnicodeSymbols",
			"ambient-noise-presets",
			"breakReminderState",
		],
		dataDatabases: ["NotepadSnapshotsDB"],
	},

	{
		id: "calculator",
		name: "Calculator",
		category: "apps",
		builtIn: true,
		icon: "icons/calculator-icon.png",
		window: "calculatorWindow",
		officialPage: "apps/calculator/index.html",
		github: "nikh-tail/CodeAlpha_Task",
		credit: "NEO-CALC Pro by Nikhil Rathor (nikh-tail)",
		license: "MIT License",
		dataKeys: ["neocalc_history", "neocalc_theme"],
	},

	{
		id: "clock",
		name: "Clock",
		category: "apps",
		builtIn: true,
		icon: "icons/clock-icon.png",
		window: "clockWindow",
		credit: "Made for BrowOS",
	},

	{
		id: "paint",
		name: "Paint",
		category: "apps",
		builtIn: true,
		icon: "icons/paint-icon.png",
		window: "paintWindow",
		url: "https://viliusle.github.io/miniPaint/",
		github: "viliusle/miniPaint",
		website: "https://viliusle.github.io/miniPaint/",
		credit: "miniPaint by ViliusL",
		license: "MIT License",
	},

	{
		id: "browser",
		name: "Browser",
		category: "apps",
		builtIn: true,
		icon: "icons/browser-icon.png",
		window: "browserWindow",
		credit: "Made for BrowOS",
	},

	// web apps

	{
		id: "spotify",
		name: "Spotify",
		category: "apps",
		icon: siteIcon("spotify.com"),
		url: "https://open.spotify.com/",
		website: "https://open.spotify.com/",
		defaultMode: "window",
		requires: "Requires a Spotify account",
	},

	// games

	{
		id: "game2048",
		name: "2048",
		category: "games",
		icon: "https://play2048.co/favicon.ico",
		url: "https://play2048.co/",
		website: "https://play2048.co/",
		github: "gabrielecirulli/2048",
	},

	{
		id: "adarkroom",
		name: "A Dark Room",
		category: "games",
		icon: "https://doublespeakgames.github.io/adarkroom/favicon.ico",
		url: "https://doublespeakgames.github.io/adarkroom/",
		website: "https://adarkroom.doublespeakgames.com",
		github: "doublespeakgames/adarkroom",
	},

	{
		id: "clumsybird",
		name: "Clumsy Bird",
		category: "games",
		icon: "https://ellisonleao.github.io/clumsy-bird/data/img/favicon.ico",
		url: "https://ellisonleao.github.io/clumsy-bird/",
		website: "https://ellisonleao.github.io/clumsy-bird/",
		github: "ellisonleao/clumsy-bird",
	},
];

// BrowStore itself: always in the Start menu, can't be removed

const browStoreApp = {
	id: "browstore",
	name: "BrowStore",
	icon: "icons/browstore-icon.png",
	window: "browstoreWindow",
};
