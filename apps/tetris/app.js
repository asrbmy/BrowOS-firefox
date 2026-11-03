// Tetris

const BEST_KEY = "browos-tetris-best";

const COLUMNS = 10;
const ROWS = 20;
const CELL = 30;

const boardCanvas = document.getElementById("board");
const board = boardCanvas.getContext("2d");
const nextCanvas = document.getElementById("next").getContext("2d");
const holdCanvas = document.getElementById("hold").getContext("2d");
const overlay = document.getElementById("overlay");
const scoreText = document.getElementById("score");
const linesText = document.getElementById("lines");
const levelText = document.getElementById("level");
const bestText = document.getElementById("best");

// every piece as a list of rotations, each a list of [x, y] cells
const SHAPES = {
	I: { color: "#35c4e0", cells: [[0, 1], [1, 1], [2, 1], [3, 1]], size: 4 },
	O: { color: "#f0cf3a", cells: [[1, 0], [2, 0], [1, 1], [2, 1]], size: 4 },
	T: { color: "#a35be0", cells: [[1, 0], [0, 1], [1, 1], [2, 1]], size: 3 },
	S: { color: "#4ccf6e", cells: [[1, 0], [2, 0], [0, 1], [1, 1]], size: 3 },
	Z: { color: "#e5534b", cells: [[0, 0], [1, 0], [1, 1], [2, 1]], size: 3 },
	J: { color: "#4a6fe0", cells: [[0, 0], [0, 1], [1, 1], [2, 1]], size: 3 },
	L: { color: "#f09a3a", cells: [[2, 0], [0, 1], [1, 1], [2, 1]], size: 3 },
};

const NAMES = Object.keys(SHAPES);

let grid; // ROWS x COLUMNS, each null or a color
let piece; // { name, cells, x, y }
let nextName;
let holdName = null;
let canHold = true;
let bag = [];
let score;
let lines;
let level;
let best = Number(localStorage.getItem(BEST_KEY)) || 0;
let state = "ready"; // ready, playing, paused, over
let dropTimer = null;

bestText.textContent = best;

function nextFromBag() {
	if (bag.length === 0) {
		bag = NAMES.slice();

		// shuffle: every piece shows up once before any repeats
		for (let i = bag.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));

			[bag[i], bag[j]] = [bag[j], bag[i]];
		}
	}

	return bag.pop();
}

function makePiece(name) {
	const shape = SHAPES[name];

	return {
		name: name,
		cells: shape.cells.map(function (cell) {
			return [cell[0], cell[1]];
		}),
		x: Math.floor((COLUMNS - shape.size) / 2),
		y: 0,
	};
}

function fits(cells, x, y) {
	return cells.every(function (cell) {
		const column = x + cell[0];
		const row = y + cell[1];

		return column >= 0 && column < COLUMNS && row < ROWS && (row < 0 || !grid[row][column]);
	});
}

function rotated(cells, size, clockwise) {
	return cells.map(function (cell) {
		return clockwise ? [size - 1 - cell[1], cell[0]] : [cell[1], size - 1 - cell[0]];
	});
}

function spawn(name) {
	piece = makePiece(name);

	canHold = true;

	if (!fits(piece.cells, piece.x, piece.y)) {
		gameOver();

		return false;
	}

	return true;
}

function spawnNext() {
	const name = nextName;

	nextName = nextFromBag();

	return spawn(name);
}

function delay() {
	return Math.max(90, 800 - (level - 1) * 70);
}

function restartDrop() {
	clearInterval(dropTimer);

	dropTimer = setInterval(function () {
		if (!move(0, 1)) {
			lock();
		}
	}, delay());
}

function newGame() {
	grid = [];

	for (let row = 0; row < ROWS; row++) {
		grid.push(new Array(COLUMNS).fill(null));
	}

	bag = [];
	holdName = null;
	score = 0;
	lines = 0;
	level = 1;

	nextName = nextFromBag();

	updateStats();

	state = "playing";

	overlay.hidden = true;

	if (spawnNext()) {
		restartDrop();
	}

	draw();
}

function gameOver() {
	clearInterval(dropTimer);

	state = "over";

	if (score > best) {
		best = score;

		localStorage.setItem(BEST_KEY, best);

		bestText.textContent = best;
	}

	overlay.textContent = "Game over. Score " + score + ". Press Enter to play again.";
	overlay.hidden = false;

	draw();
}

function updateStats() {
	scoreText.textContent = score;
	linesText.textContent = lines;
	levelText.textContent = level;
}

function move(dx, dy) {
	if (fits(piece.cells, piece.x + dx, piece.y + dy)) {
		piece.x += dx;
		piece.y += dy;

		draw();

		return true;
	}

	return false;
}

function rotate(clockwise) {
	const size = SHAPES[piece.name].size;

	if (piece.name === "O") {
		return;
	}

	const cells = rotated(piece.cells, size, clockwise);

	// try the spot, then a step to the side or up (simple wall kicks)
	const kicks = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]];

	for (let i = 0; i < kicks.length; i++) {
		if (fits(cells, piece.x + kicks[i][0], piece.y + kicks[i][1])) {
			piece.cells = cells;
			piece.x += kicks[i][0];
			piece.y += kicks[i][1];

			draw();

			return;
		}
	}
}

function lock() {
	piece.cells.forEach(function (cell) {
		const row = piece.y + cell[1];
		const column = piece.x + cell[0];

		if (row >= 0) {
			grid[row][column] = SHAPES[piece.name].color;
		}
	});

	// clear full rows
	let cleared = 0;

	for (let row = ROWS - 1; row >= 0; row--) {
		if (grid[row].every(Boolean)) {
			grid.splice(row, 1);

			grid.unshift(new Array(COLUMNS).fill(null));

			cleared++;

			row++;
		}
	}

	if (cleared > 0) {
		score += [0, 100, 300, 500, 800][cleared] * level;

		lines += cleared;

		const newLevel = Math.floor(lines / 10) + 1;

		if (newLevel !== level) {
			level = newLevel;

			restartDrop();
		}

		updateStats();
	}

	if (spawnNext()) {
		draw();
	}
}

function hardDrop() {
	let distance = 0;

	while (move(0, 1)) {
		distance++;
	}

	score += distance * 2;

	updateStats();

	lock();
}

function hold() {
	if (!canHold) {
		return;
	}

	const current = piece.name;

	if (holdName === null) {
		holdName = current;

		spawnNext();
	} else {
		const swap = holdName;

		holdName = current;

		spawn(swap);
	}

	canHold = false;

	draw();
}

function drawCell(context, column, row, color, size) {
	context.fillStyle = color;

	context.beginPath();
	context.roundRect(column * size + 1, row * size + 1, size - 2, size - 2, 4);
	context.fill();
}

function drawPreview(context, name) {
	context.clearRect(0, 0, 96, 96);

	if (!name) {
		return;
	}

	const shape = SHAPES[name];

	const size = 20;

	const xs = shape.cells.map(function (cell) { return cell[0]; });
	const ys = shape.cells.map(function (cell) { return cell[1]; });

	const width = Math.max.apply(null, xs) - Math.min.apply(null, xs) + 1;
	const height = Math.max.apply(null, ys) - Math.min.apply(null, ys) + 1;

	const offsetX = (96 / size - width) / 2 - Math.min.apply(null, xs);
	const offsetY = (96 / size - height) / 2 - Math.min.apply(null, ys);

	shape.cells.forEach(function (cell) {
		drawCell(context, cell[0] + offsetX, cell[1] + offsetY, shape.color, size);
	});
}

function draw() {
	board.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

	if (!grid) {
		return;
	}

	for (let row = 0; row < ROWS; row++) {
		for (let column = 0; column < COLUMNS; column++) {
			if (grid[row][column]) {
				drawCell(board, column, row, grid[row][column], CELL);
			}
		}
	}

	if (piece && state !== "over") {
		// where the piece would land
		let ghostY = piece.y;

		while (fits(piece.cells, piece.x, ghostY + 1)) {
			ghostY++;
		}

		board.globalAlpha = 0.25;

		piece.cells.forEach(function (cell) {
			drawCell(board, piece.x + cell[0], ghostY + cell[1], SHAPES[piece.name].color, CELL);
		});

		board.globalAlpha = 1;

		piece.cells.forEach(function (cell) {
			if (piece.y + cell[1] >= 0) {
				drawCell(board, piece.x + cell[0], piece.y + cell[1], SHAPES[piece.name].color, CELL);
			}
		});
	}

	drawPreview(nextCanvas, nextName);
	drawPreview(holdCanvas, holdName);
}

function togglePause() {
	if (state === "playing") {
		state = "paused";

		clearInterval(dropTimer);

		overlay.textContent = "Paused. Press P to continue.";
		overlay.hidden = false;
	} else if (state === "paused") {
		state = "playing";

		overlay.hidden = true;

		restartDrop();
	}
}

document.addEventListener("keydown", function (event) {
	if (event.ctrlKey || event.altKey || event.metaKey) {
		return;
	}

	const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

	if (state === "ready" || state === "over") {
		if (key === "Enter") {
			newGame();
		}

		return;
	}

	if (key === "p") {
		togglePause();

		return;
	}

	if (state !== "playing") {
		return;
	}

	const handled = {
		ArrowLeft: function () { move(-1, 0); },
		ArrowRight: function () { move(1, 0); },
		ArrowDown: function () {
			if (move(0, 1)) {
				score++;

				updateStats();
			}
		},
		ArrowUp: function () { rotate(true); },
		x: function () { rotate(true); },
		z: function () { rotate(false); },
		" ": hardDrop,
		c: hold,
	};

	if (handled[key]) {
		event.preventDefault();

		handled[key]();
	}
});

draw();
