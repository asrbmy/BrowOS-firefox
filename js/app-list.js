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

	// more apps that come with BrowOS (they live in apps/ and get their own window when opened)

	{
		id: "files",
		name: "Files",
		category: "apps",
		builtIn: true,
		icon: "icons/files-icon.svg",
		page: "apps/files/index.html",
		size: [760, 560],
		officialPage: "apps/files/index.html",
		credit: "Made for BrowOS",
		dataDatabases: ["browos-files"],
	},

	{
		id: "calendar",
		name: "Calendar",
		category: "apps",
		builtIn: true,
		icon: "icons/calendar-icon.svg",
		page: "apps/calendar/index.html",
		size: [820, 600],
		officialPage: "apps/calendar/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-calendar", "browos-calendar-fired"],
	},

	{
		id: "imageviewer",
		name: "Image Viewer",
		category: "apps",
		builtIn: true,
		icon: "icons/imageviewer-icon.svg",
		page: "apps/imageviewer/index.html",
		size: [860, 620],
		officialPage: "apps/imageviewer/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "pdfviewer",
		name: "PDF Viewer",
		category: "apps",
		builtIn: true,
		icon: "icons/pdfviewer-icon.svg",
		page: "apps/pdfviewer/index.html",
		size: [860, 640],
		officialPage: "apps/pdfviewer/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "codeeditor",
		name: "Code Editor",
		category: "apps",
		builtIn: true,
		icon: "icons/codeeditor-icon.svg",
		page: "apps/codeeditor/index.html",
		size: [820, 580],
		officialPage: "apps/codeeditor/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "notes",
		name: "Notes",
		category: "apps",
		builtIn: true,
		icon: "icons/notes-icon.svg",
		page: "apps/notes/index.html",
		size: [720, 520],
		officialPage: "apps/notes/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "habits",
		name: "Habits",
		category: "apps",
		builtIn: true,
		icon: "icons/habits-icon.svg",
		page: "apps/habits/index.html",
		size: [520, 560],
		officialPage: "apps/habits/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-habits"],
	},

	{
		id: "budget",
		name: "Budget",
		category: "apps",
		builtIn: true,
		icon: "icons/budget-icon.svg",
		page: "apps/budget/index.html",
		size: [640, 640],
		officialPage: "apps/budget/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-budget"],
	},

	{
		id: "bookmarks",
		name: "Bookmarks",
		category: "apps",
		builtIn: true,
		icon: "icons/bookmarks-icon.svg",
		page: "apps/bookmarks/index.html",
		size: [520, 560],
		officialPage: "apps/bookmarks/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "recorder",
		name: "Recorder",
		category: "apps",
		builtIn: true,
		icon: "icons/recorder-icon.svg",
		page: "apps/recorder/index.html",
		size: [520, 560],
		officialPage: "apps/recorder/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "chess",
		name: "Chess",
		category: "games",
		builtIn: true,
		icon: "icons/chess-icon.svg",
		page: "apps/chess/index.html",
		size: [820, 620],
		officialPage: "apps/chess/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "sudoku",
		name: "Sudoku",
		category: "games",
		builtIn: true,
		icon: "icons/sudoku-icon.svg",
		page: "apps/sudoku/index.html",
		size: [560, 720],
		officialPage: "apps/sudoku/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-sudoku", "browos-sudoku-best"],
	},

	{
		id: "solitaire",
		name: "Solitaire",
		category: "games",
		builtIn: true,
		icon: "icons/solitaire-icon.svg",
		page: "apps/solitaire/index.html",
		size: [880, 640],
		officialPage: "apps/solitaire/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "orbhop",
		name: "Orb Hop",
		category: "games",
		builtIn: true,
		icon: "icons/orbhop-icon.svg",
		page: "apps/orbhop/index.html",
		size: [420, 640],
		officialPage: "apps/orbhop/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-orbhop-best"],
	},

	{
		id: "todo",
		name: "To-Do",
		category: "apps",
		builtIn: true,
		icon: "icons/todo-icon.svg",
		page: "apps/todo/index.html",
		size: [520, 600],
		officialPage: "apps/todo/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-todo"],
	},

	{
		id: "pomodoro",
		name: "Pomodoro",
		category: "apps",
		builtIn: true,
		icon: "icons/pomodoro-icon.svg",
		page: "apps/pomodoro/index.html",
		size: [460, 560],
		officialPage: "apps/pomodoro/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-pomodoro"],
	},

	{
		id: "weather",
		name: "Weather",
		category: "apps",
		builtIn: true,
		icon: "icons/weather-icon.svg",
		page: "apps/weather/index.html",
		size: [560, 560],
		officialPage: "apps/weather/index.html",
		website: "https://open-meteo.com",
		credit: "Made for BrowOS, weather data by Open-Meteo",
		dataKeys: ["browos-weather-place", "browos-weather-unit"],
	},

	{
		id: "music",
		name: "Music",
		category: "apps",
		builtIn: true,
		icon: "icons/music-icon.svg",
		page: "apps/music/index.html",
		size: [520, 640],
		officialPage: "apps/music/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "terminal",
		name: "Terminal",
		category: "apps",
		builtIn: true,
		icon: "icons/terminal-icon.svg",
		page: "apps/terminal/index.html",
		size: [720, 440],
		officialPage: "apps/terminal/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "recyclebin",
		name: "Recycle Bin",
		category: "apps",
		builtIn: true,
		icon: "icons/recyclebin-icon.svg",
		page: "apps/recyclebin/index.html",
		size: [560, 440],
		officialPage: "apps/recyclebin/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "snake",
		name: "Snake",
		category: "games",
		builtIn: true,
		icon: "icons/snake-icon.svg",
		page: "apps/snake/index.html",
		size: [520, 620],
		officialPage: "apps/snake/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-snake-best"],
	},

	{
		id: "minesweeper",
		name: "Minesweeper",
		category: "games",
		builtIn: true,
		icon: "icons/minesweeper-icon.svg",
		page: "apps/minesweeper/index.html",
		size: [620, 600],
		officialPage: "apps/minesweeper/index.html",
		credit: "Made for BrowOS",
	},

	{
		id: "tetris",
		name: "Tetris",
		category: "games",
		builtIn: true,
		icon: "icons/tetris-icon.svg",
		page: "apps/tetris/index.html",
		size: [560, 680],
		officialPage: "apps/tetris/index.html",
		credit: "Made for BrowOS",
		dataKeys: ["browos-tetris-best"],
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
