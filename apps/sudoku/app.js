// Sudoku

const S = window.BrowSudoku;

const boardEl = document.getElementById("board");
const padEl = document.getElementById("pad");
const timeEl = document.getElementById("time");
const bestEl = document.getElementById("best");
const msgEl = document.getElementById("msg");
const levelSelect = document.getElementById("level");
const notesButton = document.getElementById("notes");

const SAVE_KEY = "browos-sudoku";
const BEST_KEY = "browos-sudoku-best";

let puzzle, solution, values, notes, selected = -1, seconds = 0, timer = null, finished = false, noteMode = false, level = "medium";

function bests() {
	try {
		return JSON.parse(localStorage.getItem(BEST_KEY) || "{}") || {};
	} catch (error) {
		return {};
	}
}

function clock() {
	timeEl.textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
}

function showBest() {
	const best = bests()[level];

	bestEl.textContent = best ? "Best " + Math.floor(best / 60) + ":" + String(best % 60).padStart(2, "0") : "";
}

function persist() {
	try {
		localStorage.setItem(SAVE_KEY, JSON.stringify({ puzzle, solution, values, notes: notes.map((n) => Array.from(n)), seconds, level, finished }));
	} catch (error) {
		// private mode or full storage: the game still works
	}
}

function startTimer() {
	clearInterval(timer);

	timer = setInterval(function () {
		if (!finished && !document.hidden) {
			seconds++;

			clock();

			if (seconds % 10 === 0) {
				persist();
			}
		}
	}, 1000);
}

function newGame() {
	level = levelSelect.value;

	msgEl.textContent = "Making a puzzle...";

	// let the message paint first, generating can take a moment on hard
	setTimeout(function () {
		const made = S.generate(level);

		puzzle = made.puzzle;
		solution = made.solution;
		values = puzzle.slice();
		notes = Array.from({ length: 81 }, () => new Set());
		selected = -1;
		seconds = 0;
		finished = false;

		msgEl.textContent = "";

		clock();
		showBest();
		render();
		persist();
		startTimer();
	}, 20);
}

function conflicts(index) {
	const v = values[index];

	if (v === 0) {
		return false;
	}

	const row = Math.floor(index / 9);
	const col = index % 9;

	for (let i = 0; i < 81; i++) {
		if (i === index || values[i] !== v) {
			continue;
		}

		const r = Math.floor(i / 9);
		const c = i % 9;

		if (r === row || c === col || (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3))) {
			return true;
		}
	}

	return false;
}

function render() {
	boardEl.innerHTML = "";

	const sel = selected;
	const selValue = sel >= 0 ? values[sel] : 0;

	for (let i = 0; i < 81; i++) {
		const cell = document.createElement("button");

		const row = Math.floor(i / 9);
		const col = i % 9;

		let cls = "su-cell";

		if (puzzle[i] !== 0) cls += " given";
		else if (values[i] !== 0) cls += " mine";

		if (sel >= 0) {
			const sr = Math.floor(sel / 9);
			const sc = sel % 9;

			if (i === sel) cls += " selected";
			else if (selValue !== 0 && values[i] === selValue) cls += " same";
			else if (row === sr || col === sc || (Math.floor(row / 3) === Math.floor(sr / 3) && Math.floor(col / 3) === Math.floor(sc / 3))) cls += " related";
		}

		if (values[i] !== 0 && puzzle[i] === 0 && conflicts(i)) cls += " wrong";

		cell.className = cls;
		cell.dataset.i = i;
		cell.setAttribute("role", "gridcell");
		cell.setAttribute("aria-label", "Row " + (row + 1) + " column " + (col + 1) + (values[i] ? ", " + values[i] : ", empty"));

		if (values[i] !== 0) {
			cell.textContent = values[i];
		} else if (notes[i].size) {
			const grid = document.createElement("div");

			grid.className = "su-notes";

			for (let n = 1; n <= 9; n++) {
				const span = document.createElement("span");

				span.textContent = notes[i].has(n) ? n : "";

				grid.appendChild(span);
			}

			cell.appendChild(grid);
		}

		cell.addEventListener("click", function () {
			selected = i;

			render();
		});

		boardEl.appendChild(cell);
	}

	// numbers that are all placed are dimmed
	padEl.querySelectorAll("button[data-n]").forEach(function (button) {
		const n = Number(button.dataset.n);

		button.classList.toggle("done", values.filter((v) => v === n).length >= 9);
	});
}

function place(n) {
	if (finished || selected < 0 || puzzle[selected] !== 0) {
		return;
	}

	if (n === 0) {
		values[selected] = 0;
		notes[selected].clear();
	} else if (noteMode) {
		if (values[selected] === 0) {
			notes[selected].has(n) ? notes[selected].delete(n) : notes[selected].add(n);
		}
	} else {
		values[selected] = values[selected] === n ? 0 : n;

		notes[selected].clear();

		// clear the same number from the notes it can no longer be in
		if (values[selected] !== 0) {
			const row = Math.floor(selected / 9);
			const col = selected % 9;

			for (let i = 0; i < 81; i++) {
				const r = Math.floor(i / 9);
				const c = i % 9;

				if (r === row || c === col || (Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3))) {
					notes[i].delete(n);
				}
			}
		}
	}

	msgEl.textContent = "";

	render();

	persist();

	if (values.every((v, i) => v === solution[i])) {
		win();
	}
}

function win() {
	finished = true;

	const best = bests();

	let text = "Solved in " + Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0") + "!";

	if (!best[level] || seconds < best[level]) {
		best[level] = seconds;

		localStorage.setItem(BEST_KEY, JSON.stringify(best));

		text += " New best.";
	}

	msgEl.textContent = text;

	showBest();

	persist();
}

// pad
for (let n = 1; n <= 9; n++) {
	const button = document.createElement("button");

	button.textContent = n;
	button.dataset.n = n;

	button.addEventListener("click", function () {
		place(n);
	});

	padEl.appendChild(button);
}

const erase = document.createElement("button");

erase.textContent = "⌫";
erase.title = "Erase";
erase.setAttribute("aria-label", "Erase");

erase.addEventListener("click", function () {
	place(0);
});

padEl.appendChild(erase);

notesButton.addEventListener("click", function () {
	noteMode = !noteMode;

	notesButton.textContent = "Notes: " + (noteMode ? "on" : "off");
	notesButton.classList.toggle("primary", noteMode);
});

document.getElementById("hint").addEventListener("click", function () {
	if (finished) {
		return;
	}

	// the selected cell if it is empty or wrong, otherwise the first one that is
	let target = selected >= 0 && puzzle[selected] === 0 && values[selected] !== solution[selected] ? selected : -1;

	if (target < 0) {
		target = values.findIndex((v, i) => v !== solution[i]);
	}

	if (target < 0) {
		return;
	}

	selected = target;
	values[target] = solution[target];
	notes[target].clear();

	msgEl.textContent = "Hint used";

	render();
	persist();

	if (values.every((v, i) => v === solution[i])) {
		win();
	}
});

document.getElementById("check").addEventListener("click", function () {
	const wrong = values.filter((v, i) => v !== 0 && v !== solution[i]).length;

	const empty = values.filter((v) => v === 0).length;

	msgEl.textContent = wrong ? wrong + (wrong === 1 ? " number is wrong" : " numbers are wrong") : empty ? "No mistakes so far" : "";

	// show the wrong ones
	boardEl.querySelectorAll(".su-cell").forEach(function (cell, i) {
		cell.classList.toggle("wrong", values[i] !== 0 && values[i] !== solution[i]);
	});
});

document.getElementById("newGame").addEventListener("click", newGame);

levelSelect.addEventListener("change", newGame);

document.addEventListener("keydown", function (event) {
	if (event.ctrlKey || event.altKey || event.metaKey) {
		return;
	}

	if (/^[1-9]$/.test(event.key)) {
		place(Number(event.key));
	} else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
		place(0);
	} else if (event.key.startsWith("Arrow")) {
		event.preventDefault();

		const cur = selected < 0 ? 40 : selected;
		const row = Math.floor(cur / 9);
		const col = cur % 9;

		const next = {
			ArrowUp: Math.max(0, row - 1) * 9 + col,
			ArrowDown: Math.min(8, row + 1) * 9 + col,
			ArrowLeft: row * 9 + Math.max(0, col - 1),
			ArrowRight: row * 9 + Math.min(8, col + 1),
		}[event.key];

		selected = next;

		render();
	} else if (event.key.toLowerCase() === "n") {
		notesButton.click();
	}
});

// pick up where the last game stopped
(function () {
	try {
		const saved = JSON.parse(localStorage.getItem(SAVE_KEY));

		if (saved && saved.puzzle && saved.puzzle.length === 81 && saved.values.length === 81 && saved.solution.length === 81) {
			puzzle = saved.puzzle;
			solution = saved.solution;
			values = saved.values;
			notes = saved.notes.map((n) => new Set(n));
			seconds = saved.seconds || 0;
			level = saved.level || "medium";
			finished = Boolean(saved.finished);

			levelSelect.value = level;

			clock();
			showBest();
			render();

			if (!finished) {
				startTimer();
			} else {
				msgEl.textContent = "Solved! Start a new game.";
			}

			return;
		}
	} catch (error) {
		// a broken save is ignored
	}

	newGame();
})();
