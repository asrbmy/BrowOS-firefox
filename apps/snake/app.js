// Snake

const BEST_KEY = "browos-snake-best";

const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const scoreText = document.getElementById("score");
const bestText = document.getElementById("best");
const speedSelect = document.getElementById("speed");
const restartButton = document.getElementById("restart");

const CELLS = 20;
const SIZE = canvas.width / CELLS;

let snake;
let direction;
let nextDirection;
let food;
let score;
let best = Number(localStorage.getItem(BEST_KEY)) || 0;
let timer = null;
let state = "ready"; // ready, playing, paused, over

bestText.textContent = best;

function accentColor() {
	return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2196f3";
}

function placeFood() {
	const free = [];

	for (let x = 0; x < CELLS; x++) {
		for (let y = 0; y < CELLS; y++) {
			if (
				!snake.some(function (part) {
					return part.x === x && part.y === y;
				})
			) {
				free.push({ x: x, y: y });
			}
		}
	}

	// the board is full: the game is won
	food = free.length ? free[Math.floor(Math.random() * free.length)] : null;
}

function draw() {
	context.clearRect(0, 0, canvas.width, canvas.height);

	const accent = accentColor();

	if (food) {
		context.fillStyle = "#e5534b";

		context.beginPath();
		context.arc(food.x * SIZE + SIZE / 2, food.y * SIZE + SIZE / 2, SIZE * 0.38, 0, Math.PI * 2);
		context.fill();
	}

	snake.forEach(function (part, position) {
		context.fillStyle = accent;

		context.globalAlpha = position === 0 ? 1 : 0.8;

		context.beginPath();
		context.roundRect(part.x * SIZE + 1, part.y * SIZE + 1, SIZE - 2, SIZE - 2, 5);
		context.fill();
	});

	context.globalAlpha = 1;
}

function stop() {
	clearInterval(timer);

	timer = null;
}

function begin() {
	stop();

	timer = setInterval(step, Number(speedSelect.value));
}

function reset() {
	stop();

	snake = [
		{ x: 10, y: 10 },
		{ x: 9, y: 10 },
		{ x: 8, y: 10 },
	];

	direction = { x: 1, y: 0 };
	nextDirection = direction;

	score = 0;

	scoreText.textContent = score;

	placeFood();

	state = "ready";

	overlay.textContent = "Press any arrow key or WASD to start";
	overlay.hidden = false;

	draw();
}

function gameOver(won) {
	stop();

	state = "over";

	if (score > best) {
		best = score;

		localStorage.setItem(BEST_KEY, best);

		bestText.textContent = best;
	}

	overlay.textContent = (won ? "You filled the board! " : "Game over. ") + "Score " + score + ". Press Enter to play again.";
	overlay.hidden = false;
}

function step() {
	direction = nextDirection;

	const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

	const hitsWall = head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS;

	const eating = food && head.x === food.x && head.y === food.y;

	// the tail moves away this turn unless the snake grows
	const body = eating ? snake : snake.slice(0, -1);

	const hitsSelf = body.some(function (part) {
		return part.x === head.x && part.y === head.y;
	});

	if (hitsWall || hitsSelf) {
		gameOver(false);

		return;
	}

	snake.unshift(head);

	if (eating) {
		score++;

		scoreText.textContent = score;

		placeFood();

		if (!food) {
			draw();

			gameOver(true);

			return;
		}
	} else {
		snake.pop();
	}

	draw();
}

function turn(x, y) {
	// can't turn back into yourself
	if (x === -direction.x && y === -direction.y) {
		return;
	}

	nextDirection = { x: x, y: y };
}

const keys = {
	ArrowUp: [0, -1],
	ArrowDown: [0, 1],
	ArrowLeft: [-1, 0],
	ArrowRight: [1, 0],
	w: [0, -1],
	s: [0, 1],
	a: [-1, 0],
	d: [1, 0],
};

document.addEventListener("keydown", function (event) {
	const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

	if (event.ctrlKey || event.altKey || event.metaKey) {
		return;
	}

	if (state === "over") {
		if (event.key === "Enter") {
			reset();
		}

		return;
	}

	if (key === " " || key === "p") {
		event.preventDefault();

		if (state === "playing") {
			state = "paused";

			stop();

			overlay.textContent = "Paused. Press Space to continue.";
			overlay.hidden = false;
		} else if (state === "paused") {
			state = "playing";

			overlay.hidden = true;

			begin();
		}

		return;
	}

	if (!keys[key]) {
		return;
	}

	event.preventDefault();

	if (state === "paused") {
		return;
	}

	turn(keys[key][0], keys[key][1]);

	if (state === "ready") {
		state = "playing";

		overlay.hidden = true;

		begin();
	}
});

speedSelect.addEventListener("change", function () {
	if (state === "playing") {
		begin();
	}

	speedSelect.blur();
});

restartButton.addEventListener("click", function () {
	reset();

	restartButton.blur();
});

reset();
