// Minesweeper

const board = document.getElementById("board");
const flagsText = document.getElementById("flags");
const timerText = document.getElementById("timer");
const face = document.getElementById("face");
const levelSelect = document.getElementById("level");

const LEVELS = {
	easy: { columns: 9, rows: 9, mines: 10 },
	medium: { columns: 16, rows: 16, mines: 40 },
	hard: { columns: 24, rows: 16, mines: 70 },
};

let level = LEVELS.easy;
let cells = []; // { mine, open, flag, count, button }
let state = "ready"; // ready, playing, won, lost
let flagsLeft = 0;
let seconds = 0;
let clock = null;

function three(number) {
	return String(Math.max(-99, Math.min(999, number))).padStart(3, "0");
}

function index(column, row) {
	return row * level.columns + column;
}

function neighbors(column, row) {
	const list = [];

	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			const x = column + dx;
			const y = row + dy;

			if ((dx !== 0 || dy !== 0) && x >= 0 && y >= 0 && x < level.columns && y < level.rows) {
				list.push(index(x, y));
			}
		}
	}

	return list;
}

function stopClock() {
	clearInterval(clock);

	clock = null;
}

function newGame() {
	stopClock();

	level = LEVELS[levelSelect.value] || LEVELS.easy;

	state = "ready";
	seconds = 0;
	flagsLeft = level.mines;

	timerText.textContent = three(0);
	flagsText.textContent = three(flagsLeft);
	face.textContent = "🙂";

	board.innerHTML = "";
	board.style.gridTemplateColumns = "repeat(" + level.columns + ", 30px)";

	cells = [];

	for (let row = 0; row < level.rows; row++) {
		for (let column = 0; column < level.columns; column++) {
			const button = document.createElement("button");

			button.className = "mines-cell";
			button.dataset.column = column;
			button.dataset.row = row;

			board.appendChild(button);

			cells.push({ mine: false, open: false, flag: false, count: 0, button: button });
		}
	}
}

// mines are placed on the first click, so the first click is always safe
function placeMines(safeColumn, safeRow) {
	const forbidden = new Set(neighbors(safeColumn, safeRow));

	forbidden.add(index(safeColumn, safeRow));

	const candidates = [];

	cells.forEach(function (cell, position) {
		if (!forbidden.has(position)) {
			candidates.push(position);
		}
	});

	for (let placed = 0; placed < level.mines && candidates.length > 0; placed++) {
		const pick = Math.floor(Math.random() * candidates.length);

		cells[candidates[pick]].mine = true;

		candidates.splice(pick, 1);
	}

	cells.forEach(function (cell, position) {
		const column = position % level.columns;
		const row = Math.floor(position / level.columns);

		cell.count = neighbors(column, row).filter(function (other) {
			return cells[other].mine;
		}).length;
	});
}

function show(cell) {
	cell.button.classList.add("open");

	if (cell.count > 0) {
		cell.button.textContent = cell.count;

		cell.button.classList.add("n" + cell.count);
	}
}

function openCell(column, row) {
	const start = cells[index(column, row)];

	if (start.open || start.flag) {
		return;
	}

	// open empty areas with a list instead of recursion (large boards)
	const pending = [index(column, row)];

	while (pending.length > 0) {
		const position = pending.pop();

		const cell = cells[position];

		if (cell.open || cell.flag) {
			continue;
		}

		cell.open = true;

		show(cell);

		if (cell.count === 0) {
			neighbors(position % level.columns, Math.floor(position / level.columns)).forEach(function (other) {
				if (!cells[other].open) {
					pending.push(other);
				}
			});
		}
	}
}

function finish(won) {
	stopClock();

	state = won ? "won" : "lost";

	face.textContent = won ? "😎" : "😵";

	cells.forEach(function (cell) {
		if (cell.mine && !cell.flag) {
			cell.button.textContent = won ? "🚩" : "💣";
		}

		if (!cell.mine && cell.flag) {
			cell.button.textContent = "❌";

			cell.button.classList.add("wrong");
		}
	});

	if (won) {
		flagsText.textContent = three(0);
	}
}

function checkWin() {
	const safeLeft = cells.filter(function (cell) {
		return !cell.mine && !cell.open;
	}).length;

	if (safeLeft === 0) {
		finish(true);
	}
}

function startClock() {
	clock = setInterval(function () {
		seconds++;

		timerText.textContent = three(seconds);
	}, 1000);
}

function click(column, row) {
	if (state === "won" || state === "lost") {
		return;
	}

	const cell = cells[index(column, row)];

	if (cell.flag) {
		return;
	}

	if (state === "ready") {
		placeMines(column, row);

		state = "playing";

		startClock();
	}

	if (cell.open) {
		// clicking a number whose flags match opens the rest around it
		const around = neighbors(column, row);

		const flagged = around.filter(function (other) {
			return cells[other].flag;
		}).length;

		if (cell.count > 0 && flagged === cell.count) {
			around.forEach(function (other) {
				const target = cells[other];

				if (target.flag || target.open) {
					return;
				}

				if (target.mine) {
					target.button.classList.add("boom");

					finish(false);
				} else {
					openCell(other % level.columns, Math.floor(other / level.columns));
				}
			});

			if (state === "playing") {
				checkWin();
			}
		}

		return;
	}

	if (cell.mine) {
		cell.button.classList.add("boom");

		cell.open = true;

		finish(false);

		return;
	}

	openCell(column, row);

	checkWin();
}

function toggleFlag(column, row) {
	if (state === "won" || state === "lost") {
		return;
	}

	const cell = cells[index(column, row)];

	if (cell.open) {
		return;
	}

	if (!cell.flag && flagsLeft === 0) {
		return;
	}

	cell.flag = !cell.flag;

	cell.button.textContent = cell.flag ? "🚩" : "";

	flagsLeft += cell.flag ? -1 : 1;

	flagsText.textContent = three(flagsLeft);
}

function cellFromEvent(event) {
	const button = event.target.closest(".mines-cell");

	if (!button) {
		return null;
	}

	return { column: Number(button.dataset.column), row: Number(button.dataset.row) };
}

let longPress = null;
let longPressed = false;

board.addEventListener("click", function (event) {
	// a long press already placed a flag
	if (longPressed) {
		longPressed = false;

		return;
	}

	const where = cellFromEvent(event);

	if (where) {
		click(where.column, where.row);
	}
});

board.addEventListener("contextmenu", function (event) {
	event.preventDefault();

	const where = cellFromEvent(event);

	if (where) {
		toggleFlag(where.column, where.row);
	}
});

board.addEventListener("pointerdown", function (event) {
	if (event.pointerType === "mouse") {
		return;
	}

	const where = cellFromEvent(event);

	if (!where) {
		return;
	}

	longPress = setTimeout(function () {
		longPressed = true;

		toggleFlag(where.column, where.row);
	}, 450);
});

["pointerup", "pointercancel", "pointerleave"].forEach(function (name) {
	board.addEventListener(name, function () {
		clearTimeout(longPress);
	});
});

face.addEventListener("click", newGame);

levelSelect.addEventListener("change", newGame);

newGame();
