// Klondike solitaire, one card at a time

const table = document.getElementById("table");
const movesEl = document.getElementById("moves");
const timeEl = document.getElementById("time");
const msgEl = document.getElementById("msg");

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

let game; // { stock, waste, found:[4], tab:[7], moves }
let selection = null; // { from: "waste" | {tab: i}, index }
let undoStack = [];
let seconds = 0;
let timer = null;
let won = false;

const isRed = (card) => card.s === 1 || card.s === 2;

function deal() {
	const deck = [];

	for (let s = 0; s < 4; s++) {
		for (let r = 1; r <= 13; r++) {
			deck.push({ s: s, r: r, up: false });
		}
	}

	for (let i = deck.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		[deck[i], deck[j]] = [deck[j], deck[i]];
	}

	const tab = [];

	for (let i = 0; i < 7; i++) {
		const pile = deck.splice(0, i + 1);

		pile[pile.length - 1].up = true;

		tab.push(pile);
	}

	return { stock: deck, waste: [], found: [[], [], [], []], tab: tab, moves: 0 };
}

function newGame() {
	game = deal();
	selection = null;
	undoStack = [];
	seconds = 0;
	won = false;

	msgEl.textContent = "";

	clearInterval(timer);

	timer = setInterval(function () {
		if (!won && !document.hidden) {
			seconds++;

			timeEl.textContent = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
		}
	}, 1000);

	timeEl.textContent = "0:00";

	render();
}

function snapshot() {
	undoStack.push(JSON.stringify(game));

	if (undoStack.length > 300) {
		undoStack.shift();
	}
}

function canTableau(card, pile) {
	if (pile.length === 0) {
		return card.r === 13;
	}

	const top = pile[pile.length - 1];

	return top.up && isRed(top) !== isRed(card) && top.r === card.r + 1;
}

function canFoundation(card) {
	const pile = game.found[card.s];

	return pile.length === card.r - 1;
}

function sourceCards(from) {
	if (from.type === "waste") {
		return game.waste.length ? [game.waste[game.waste.length - 1]] : [];
	}

	if (from.type === "found") {
		return game.found[from.pile].length ? [game.found[from.pile][game.found[from.pile].length - 1]] : [];
	}

	return game.tab[from.pile].slice(from.index);
}

function removeSource(from) {
	if (from.type === "waste") {
		return [game.waste.pop()];
	}

	if (from.type === "found") {
		return [game.found[from.pile].pop()];
	}

	const moved = game.tab[from.pile].splice(from.index);

	const pile = game.tab[from.pile];

	if (pile.length && !pile[pile.length - 1].up) {
		pile[pile.length - 1].up = true;
	}

	return moved;
}

// to: { type: "tab" | "found", pile }
function tryMove(from, to) {
	const cards = sourceCards(from);

	if (cards.length === 0 || !cards[0].up) {
		return false;
	}

	if (to.type === "found") {
		if (cards.length !== 1 || !canFoundation(cards[0])) {
			return false;
		}
	} else if (!canTableau(cards[0], game.tab[to.pile]) || (from.type === "tab" && from.pile === to.pile)) {
		return false;
	}

	snapshot();

	const moved = removeSource(from);

	if (to.type === "found") {
		game.found[moved[0].s].push(moved[0]);
	} else {
		game.tab[to.pile].push(...moved);
	}

	game.moves++;

	selection = null;

	checkWin();

	render();

	return true;
}

// the card goes to the foundation if it can
function autoOne(from) {
	const cards = sourceCards(from);

	if (cards.length !== 1 || !cards[0].up || !canFoundation(cards[0])) {
		return false;
	}

	return tryMove(from, { type: "found", pile: cards[0].s });
}

function drawStock() {
	snapshot();

	if (game.stock.length) {
		const card = game.stock.pop();

		card.up = true;

		game.waste.push(card);
	} else if (game.waste.length) {
		game.stock = game.waste.reverse().map(function (card) {
			card.up = false;

			return card;
		});

		game.waste = [];
	} else {
		undoStack.pop();

		return;
	}

	game.moves++;

	selection = null;

	render();
}

function checkWin() {
	if (game.found.every((pile) => pile.length === 13)) {
		won = true;

		msgEl.textContent = "You won in " + game.moves + " moves!";
	}
}

function autoAll() {
	let moved = true;

	let count = 0;

	while (moved && !won) {
		moved = false;

		const sources = [{ type: "waste" }].concat(game.tab.map((_, i) => ({ type: "tab", pile: i, index: game.tab[i].length - 1 })));

		for (const from of sources) {
			if (from.type === "tab" && from.index < 0) {
				continue;
			}

			if (autoOne(from)) {
				moved = true;
				count++;
			}
		}
	}

	if (count === 0) {
		msgEl.textContent = "Nothing to move";
	}
}

function cardEl(card, top, onClick, onDouble, selected) {
	const el = document.createElement("div");

	el.className = "card" + (card.up ? "" : " down") + (isRed(card) ? " red" : "") + (selected ? " selected" : "");
	el.style.top = top;

	if (card.up) {
		el.setAttribute("aria-label", RANKS[card.r] + " of " + ["spades", "hearts", "diamonds", "clubs"][card.s]);

		const hi = document.createElement("span");

		hi.textContent = RANKS[card.r] + SUITS[card.s];

		const mid = document.createElement("span");

		mid.className = "mid";
		mid.textContent = SUITS[card.s];

		const lo = document.createElement("span");

		lo.className = "low";
		lo.textContent = RANKS[card.r] + SUITS[card.s];

		el.append(hi, mid, lo);
	} else {
		el.setAttribute("aria-label", "face down card");
	}

	if (card.up) {
		el.addEventListener("click", function (event) {
			event.stopPropagation();

			onClick();
		});

		el.addEventListener("dblclick", function (event) {
			event.stopPropagation();

			onDouble();
		});
	}

	return el;
}

function sameSource(a, b) {
	return a && b && a.type === b.type && a.pile === b.pile && a.index === b.index;
}

function select(from) {
	selection = sameSource(selection, from) ? null : from;

	render();
}

function clickTarget(to) {
	if (selection) {
		if (!tryMove(selection, to)) {
			selection = null;

			render();
		}
	}
}

function render() {
	table.innerHTML = "";

	movesEl.textContent = game.moves;

	// stock
	const stock = document.createElement("div");

	stock.className = "slot";
	stock.id = "stock";
	stock.setAttribute("role", "button");
	stock.setAttribute("aria-label", game.stock.length ? "Draw a card" : "Turn the waste pile over");

	if (game.stock.length) {
		const back = document.createElement("div");

		back.className = "card down";
		back.style.top = "0";

		stock.appendChild(back);
	} else if (game.waste.length) {
		const again = document.createElement("div");

		again.className = "recycle";
		again.textContent = "↻";

		stock.appendChild(again);
	}

	stock.addEventListener("click", drawStock);

	table.appendChild(stock);

	// waste
	const waste = document.createElement("div");

	waste.className = "slot";
	waste.id = "waste";

	if (game.waste.length) {
		const card = game.waste[game.waste.length - 1];

		waste.appendChild(
			cardEl(card, "0", () => select({ type: "waste" }), () => autoOne({ type: "waste" }), sameSource(selection, { type: "waste" }))
		);
	}

	table.appendChild(waste);

	table.appendChild(document.createElement("div"));

	// foundations
	for (let f = 0; f < 4; f++) {
		const slot = document.createElement("div");

		slot.className = "slot";
		slot.dataset.found = f;
		slot.setAttribute("aria-label", SUITS[f] + " foundation");

		const pile = game.found[f];

		if (pile.length) {
			slot.appendChild(
				cardEl(pile[pile.length - 1], "0", () => select({ type: "found", pile: f }), () => {}, sameSource(selection, { type: "found", pile: f }))
			);
		} else {
			const hint = document.createElement("div");

			hint.className = "recycle";
			hint.textContent = SUITS[f];

			slot.appendChild(hint);
		}

		slot.addEventListener("click", function () {
			clickTarget({ type: "found", pile: f });
		});

		table.appendChild(slot);
	}

	// tableau
	game.tab.forEach(function (pile, i) {
		const column = document.createElement("div");

		column.className = "pile";
		column.dataset.tab = i;

		const step = 0.3;

		let offset = 0;

		pile.forEach(function (card, index) {
			const from = { type: "tab", pile: i, index: index };

			const selected = selection && selection.type === "tab" && selection.pile === i && index >= selection.index;

			column.appendChild(
				cardEl(
					card,
					"calc(var(--ch) * " + offset.toFixed(2) + ")",
					function () {
						// a click on a card while another stack is picked tries to drop it there
						if (selection && !sameSource(selection, from)) {
							clickTarget({ type: "tab", pile: i });
						} else {
							select(from);
						}
					},
					function () {
						if (index === pile.length - 1) {
							autoOne(from);
						}
					},
					selected
				)
			);

			offset += card.up ? step : 0.12;
		});

		column.style.height = "calc(var(--ch) * " + (offset + 1).toFixed(2) + ")";

		column.addEventListener("click", function () {
			clickTarget({ type: "tab", pile: i });
		});

		table.appendChild(column);
	});
}

document.getElementById("newGame").addEventListener("click", newGame);

document.getElementById("undo").addEventListener("click", function () {
	if (undoStack.length) {
		game = JSON.parse(undoStack.pop());

		selection = null;
		won = false;

		msgEl.textContent = "";

		render();
	}
});

document.getElementById("auto").addEventListener("click", autoAll);

document.addEventListener("keydown", function (event) {
	if (event.key === "z" && (event.ctrlKey || event.metaKey)) {
		document.getElementById("undo").click();
	} else if (event.key === " " || event.key === "d") {
		event.preventDefault();

		drawStock();
	} else if (event.key === "Escape") {
		selection = null;

		render();
	}
});

newGame();
