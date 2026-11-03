// Chess: the board and the people (or the computer) playing it

const C = window.BrowChess;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const movesEl = document.getElementById("moves");
const promoEl = document.getElementById("promo");
const modeSelect = document.getElementById("mode");
const sideSelect = document.getElementById("side");

const GLYPH = { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟", k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };

let state = C.fromFen(C.START);
let history = []; // { before, move, text }
let selected = -1;
let flipped = false;
let thinking = false;
let over = false;
let pending = null; // promotion waiting for a choice

function human(color) {
	const level = Number(modeSelect.value);

	return level === 0 || sideSelect.value === color;
}

function render() {
	const legal = C.legalMoves(state);

	const targets = selected >= 0 ? legal.filter((m) => m.from === selected) : [];

	const last = history.length ? history[history.length - 1].move : null;

	const kingInCheck = C.inCheck(state, state.turn) ? state.board.indexOf(state.turn === "w" ? "K" : "k") : -1;

	boardEl.innerHTML = "";

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const index = flipped ? 63 - (row * 8 + col) : row * 8 + col;

			const cell = document.createElement("button");

			const file = index % 8;
			const rank = Math.floor(index / 8);

			const hit = targets.some((m) => m.to === index);

			cell.className =
				"sq " +
				((file + rank) % 2 === 0 ? "light" : "dark") +
				(index === selected ? " selected" : "") +
				(last && (last.from === index || last.to === index) ? " last" : "") +
				(index === kingInCheck ? " check" : "") +
				(hit ? " target" + (state.board[index] !== "" || targets.find((m) => m.to === index && m.enPassant) ? " capture" : "") : "");

			cell.dataset.sq = C.name(index);
			cell.setAttribute("role", "gridcell");

			const piece = state.board[index];

			cell.setAttribute("aria-label", C.name(index) + (piece ? ", " + (C.colorOf(piece) === "w" ? "white " : "black ") + GLYPH[piece] : ", empty"));

			if (piece) {
				const span = document.createElement("span");

				span.className = "piece " + (C.colorOf(piece) === "w" ? "white" : "black");
				span.textContent = GLYPH[piece];

				cell.appendChild(span);
			}

			if (row === 7 && col === 0) {
				const coord = document.createElement("span");

				coord.className = "coord";
				coord.textContent = C.name(index);

				cell.appendChild(coord);
			}

			cell.addEventListener("click", function () {
				click(index);
			});

			boardEl.appendChild(cell);
		}
	}

	// moves list
	movesEl.innerHTML = "";

	for (let i = 0; i < history.length; i += 2) {
		const item = document.createElement("li");

		const white = document.createElement("span");

		white.textContent = history[i].text;

		item.appendChild(white);

		if (history[i + 1]) {
			const black = document.createElement("span");

			black.textContent = history[i + 1].text;

			item.appendChild(black);
		}

		movesEl.appendChild(item);
	}

	movesEl.scrollTop = movesEl.scrollHeight;

	// status
	const result = C.status(state, legal);

	over = result !== "playing";

	const who = state.turn === "w" ? "White" : "Black";

	let text;

	if (result === "checkmate") {
		text = "Checkmate. " + (state.turn === "w" ? "Black" : "White") + " wins.";
	} else if (result === "stalemate") {
		text = "Stalemate. It's a draw.";
	} else if (result === "insufficient") {
		text = "Draw: not enough pieces left to win.";
	} else if (result === "draw50") {
		text = "Draw: 50 moves without a capture or pawn move.";
	} else {
		text = thinking ? "Computer is thinking..." : who + " to move" + (C.inCheck(state, state.turn) ? " (check)" : "");
	}

	statusEl.textContent = text;
}

function play(move) {
	const before = state;

	const text = C.san(before, move);

	state = C.apply(before, move);

	history.push({ before: before, move: move, text: text });

	selected = -1;

	render();

	maybeComputer();
}

function click(index) {
	if (over || thinking || pending || !human(state.turn)) {
		return;
	}

	const legal = C.legalMoves(state);

	const options = legal.filter((m) => m.from === selected && m.to === index);

	if (options.length) {
		if (options[0].promo) {
			askPromotion(options);
		} else {
			play(options[0]);
		}

		return;
	}

	const piece = state.board[index];

	selected = piece !== "" && C.colorOf(piece) === state.turn && legal.some((m) => m.from === index) ? index : -1;

	render();
}

function askPromotion(options) {
	pending = options;

	promoEl.innerHTML = "";

	promoEl.hidden = false;

	["q", "r", "b", "n"].forEach(function (kind) {
		const button = document.createElement("button");

		button.textContent = GLYPH[kind];
		button.title = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" }[kind];
		button.setAttribute("aria-label", button.title);

		button.addEventListener("click", function () {
			const move = options.find((m) => m.promo === kind);

			pending = null;

			promoEl.hidden = true;

			play(move);
		});

		promoEl.appendChild(button);
	});
}

function maybeComputer() {
	const level = Number(modeSelect.value);

	if (over || level === 0 || human(state.turn)) {
		return;
	}

	thinking = true;

	render();

	// let the board paint before the search blocks the page
	setTimeout(function () {
		const move = C.bestMove(state, level);

		thinking = false;

		if (move) {
			play(move);
		} else {
			render();
		}
	}, 60);
}

function newGame() {
	state = C.fromFen(C.START);
	history = [];
	selected = -1;
	pending = null;
	thinking = false;

	promoEl.hidden = true;

	flipped = Number(modeSelect.value) !== 0 && sideSelect.value === "b";

	render();

	maybeComputer();
}

document.getElementById("newGame").addEventListener("click", newGame);

document.getElementById("flip").addEventListener("click", function () {
	flipped = !flipped;

	render();
});

document.getElementById("undo").addEventListener("click", function () {
	if (thinking || history.length === 0) {
		return;
	}

	state = history.pop().before;

	// against the computer, take back its reply too so it's the person's turn again
	if (Number(modeSelect.value) !== 0) {
		while (!human(state.turn) && history.length) {
			state = history.pop().before;
		}
	}

	selected = -1;
	pending = null;
	promoEl.hidden = true;

	render();

	// playing Black and everything was taken back: the computer opens again
	maybeComputer();
});

modeSelect.addEventListener("change", newGame);
sideSelect.addEventListener("change", newGame);

render();
