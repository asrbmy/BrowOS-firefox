// Orb Hop: one button. Hop the orb through the gaps in the walls.

const BEST_KEY = "browos-orbhop-best";

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

const W = canvas.width;
const H = canvas.height;

const GRAVITY = 1500;
const HOP = -460;
const RADIUS = 14;
const WALL_W = 62;
const GAP = 165;
const WALL_EVERY = 230;

let orb, walls, score, state = "ready", last = 0, scrolled = 0;
let best = Number(localStorage.getItem(BEST_KEY)) || 0;

bestEl.textContent = best;

function accent() {
	return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#38bdf8";
}

function reset() {
	orb = { x: 110, y: H / 2, vy: 0 };
	walls = [];
	score = 0;
	scrolled = 0;

	scoreEl.textContent = 0;

	for (let i = 0; i < 3; i++) {
		addWall(W + i * WALL_EVERY);
	}
}

function addWall(x) {
	const margin = 70;

	walls.push({ x: x, gapY: margin + GAP / 2 + Math.random() * (H - 2 * margin - GAP), passed: false });
}

function speed() {
	// a little faster every five walls
	return 150 + Math.min(110, Math.floor(score / 5) * 12);
}

function hop() {
	if (state === "ready" || state === "over") {
		reset();

		state = "playing";

		overlay.hidden = true;

		last = performance.now();
	}

	if (state === "playing") {
		orb.vy = HOP;
	} else if (state === "paused") {
		state = "playing";

		overlay.hidden = true;

		last = performance.now();
	}
}

function die() {
	state = "over";

	if (score > best) {
		best = score;

		localStorage.setItem(BEST_KEY, best);

		bestEl.textContent = best;
	}

	overlay.hidden = false;
	overlay.textContent = "Score " + score + (score >= best && score > 0 ? "\nNew best!" : "") + "\nPress Space or click to play again";
}

function update(dt) {
	orb.vy += GRAVITY * dt;
	orb.y += orb.vy * dt;

	const move = speed() * dt;

	scrolled += move;

	walls.forEach(function (wall) {
		wall.x -= move;

		if (!wall.passed && wall.x + WALL_W < orb.x - RADIUS) {
			wall.passed = true;

			score++;

			scoreEl.textContent = score;
		}
	});

	if (walls.length && walls[0].x + WALL_W < 0) {
		walls.shift();

		addWall(walls[walls.length - 1].x + WALL_EVERY);
	}

	if (orb.y - RADIUS < 0 || orb.y + RADIUS > H) {
		die();

		return;
	}

	for (const wall of walls) {
		if (orb.x + RADIUS > wall.x && orb.x - RADIUS < wall.x + WALL_W) {
			if (orb.y - RADIUS < wall.gapY - GAP / 2 || orb.y + RADIUS > wall.gapY + GAP / 2) {
				die();

				return;
			}
		}
	}
}

function draw() {
	const color = accent();

	ctx.clearRect(0, 0, W, H);

	// stars drifting by
	ctx.fillStyle = "rgba(255,255,255,0.35)";

	for (let i = 0; i < 40; i++) {
		const x = ((i * 97 - scrolled * 0.3) % W + W) % W;
		const y = (i * 53) % H;

		ctx.fillRect(x, y, 2, 2);
	}

	walls.forEach(function (wall) {
		ctx.fillStyle = color;
		ctx.globalAlpha = 0.85;

		ctx.fillRect(wall.x, 0, WALL_W, wall.gapY - GAP / 2);
		ctx.fillRect(wall.x, wall.gapY + GAP / 2, WALL_W, H);

		ctx.globalAlpha = 1;

		ctx.fillStyle = "rgba(255,255,255,0.35)";

		ctx.fillRect(wall.x, wall.gapY - GAP / 2 - 6, WALL_W, 6);
		ctx.fillRect(wall.x, wall.gapY + GAP / 2, WALL_W, 6);
	});

	if (orb) {
		const glow = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, RADIUS * 2.2);

		glow.addColorStop(0, "rgba(251,191,36,1)");
		glow.addColorStop(0.45, "rgba(251,191,36,0.9)");
		glow.addColorStop(1, "rgba(251,191,36,0)");

		ctx.fillStyle = glow;

		ctx.beginPath();
		ctx.arc(orb.x, orb.y, RADIUS * 2.2, 0, Math.PI * 2);
		ctx.fill();
	}
}

function frame(now) {
	if (state === "playing") {
		// long gaps (a hidden tab) count as one short step
		const dt = Math.min(0.033, (now - last) / 1000);

		last = now;

		update(dt);
	}

	draw();

	requestAnimationFrame(frame);
}

canvas.addEventListener("pointerdown", function (event) {
	event.preventDefault();

	hop();
});

document.addEventListener("keydown", function (event) {
	if (event.key === " " || event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
		event.preventDefault();

		if (!event.repeat) {
			hop();
		}
	} else if (event.key === "p" || event.key === "P") {
		if (state === "playing") {
			state = "paused";

			overlay.hidden = false;
			overlay.textContent = "Paused\nPress Space to continue";
		}
	}
});

// leaving the window pauses
document.addEventListener("visibilitychange", function () {
	if (document.hidden && state === "playing") {
		state = "paused";

		overlay.hidden = false;
		overlay.textContent = "Paused\nPress Space to continue";
	}
});

window.addEventListener("blur", function () {
	if (state === "playing") {
		state = "paused";

		overlay.hidden = false;
		overlay.textContent = "Paused\nPress Space to continue";
	}
});

reset();

requestAnimationFrame(frame);
