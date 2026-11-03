// Chess rules and a small engine. No DOM in here, so it can be tested on its own.
// board: array of 64 squares, index 0 = a8 ... 63 = h1. Pieces: PNBRQK white, pnbrqk black, "" empty.

window.BrowChess = (function () {
	const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

	const KNIGHT = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
	const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
	const BISHOP = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
	const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]];

	function colorOf(piece) {
		return piece === "" ? "" : piece === piece.toUpperCase() ? "w" : "b";
	}

	function sq(file, rank) {
		return rank * 8 + file;
	}

	function name(index) {
		return "abcdefgh"[index % 8] + (8 - Math.floor(index / 8));
	}

	function parseSquare(text) {
		return sq("abcdefgh".indexOf(text[0]), 8 - Number(text[1]));
	}

	function fromFen(fen) {
		const parts = fen.split(" ");

		const board = [];

		parts[0].split("/").forEach(function (row) {
			for (const ch of row) {
				if (/\d/.test(ch)) {
					for (let i = 0; i < Number(ch); i++) {
						board.push("");
					}
				} else {
					board.push(ch);
				}
			}
		});

		return {
			board: board,
			turn: parts[1] || "w",
			castling: parts[2] && parts[2] !== "-" ? parts[2] : "",
			ep: parts[3] && parts[3] !== "-" ? parseSquare(parts[3]) : -1,
			half: Number(parts[4]) || 0,
			full: Number(parts[5]) || 1,
		};
	}

	function toFen(s) {
		let out = "";

		for (let r = 0; r < 8; r++) {
			let empty = 0;

			for (let f = 0; f < 8; f++) {
				const p = s.board[sq(f, r)];

				if (p === "") {
					empty++;
				} else {
					out += (empty ? empty : "") + p;
					empty = 0;
				}
			}

			out += (empty ? empty : "") + (r < 7 ? "/" : "");
		}

		return [out, s.turn, s.castling || "-", s.ep >= 0 ? name(s.ep) : "-", s.half, s.full].join(" ");
	}

	function attacked(board, target, by) {
		const tf = target % 8;
		const tr = Math.floor(target / 8);

		// pawns: a white pawn attacks up the board (towards rank index 0)
		const pr = by === "w" ? tr + 1 : tr - 1;

		for (const df of [-1, 1]) {
			const f = tf + df;

			if (f >= 0 && f < 8 && pr >= 0 && pr < 8 && board[sq(f, pr)] === (by === "w" ? "P" : "p")) {
				return true;
			}
		}

		const knight = by === "w" ? "N" : "n";

		for (const d of KNIGHT) {
			const f = tf + d[1];
			const r = tr + d[0];

			if (f >= 0 && f < 8 && r >= 0 && r < 8 && board[sq(f, r)] === knight) {
				return true;
			}
		}

		const king = by === "w" ? "K" : "k";

		for (const d of KING) {
			const f = tf + d[1];
			const r = tr + d[0];

			if (f >= 0 && f < 8 && r >= 0 && r < 8 && board[sq(f, r)] === king) {
				return true;
			}
		}

		function slide(dirs, a, b) {
			for (const d of dirs) {
				let f = tf + d[1];
				let r = tr + d[0];

				while (f >= 0 && f < 8 && r >= 0 && r < 8) {
					const p = board[sq(f, r)];

					if (p !== "") {
						if (p === a || p === b) {
							return true;
						}

						break;
					}

					f += d[1];
					r += d[0];
				}
			}

			return false;
		}

		return slide(BISHOP, by === "w" ? "B" : "b", by === "w" ? "Q" : "q") || slide(ROOK, by === "w" ? "R" : "r", by === "w" ? "Q" : "q");
	}

	function kingSquare(board, color) {
		return board.indexOf(color === "w" ? "K" : "k");
	}

	function inCheck(s, color) {
		const k = kingSquare(s.board, color);

		return k >= 0 && attacked(s.board, k, color === "w" ? "b" : "w");
	}

	function pseudoMoves(s) {
		const moves = [];
		const me = s.turn;
		const them = me === "w" ? "b" : "w";
		const b = s.board;

		function add(from, to, extra) {
			moves.push(Object.assign({ from: from, to: to, piece: b[from], captured: b[to] }, extra));
		}

		for (let from = 0; from < 64; from++) {
			const p = b[from];

			if (p === "" || colorOf(p) !== me) {
				continue;
			}

			const f = from % 8;
			const r = Math.floor(from / 8);
			const type = p.toUpperCase();

			if (type === "P") {
				const dir = me === "w" ? -1 : 1;
				const startRank = me === "w" ? 6 : 1;
				const lastRank = me === "w" ? 0 : 7;

				function pawnMove(to, extra) {
					if (Math.floor(to / 8) === lastRank) {
						for (const promo of ["q", "r", "b", "n"]) {
							add(from, to, Object.assign({ promo: promo }, extra));
						}
					} else {
						add(from, to, extra);
					}
				}

				const one = sq(f, r + dir);

				if (r + dir >= 0 && r + dir < 8 && b[one] === "") {
					pawnMove(one);

					const two = sq(f, r + 2 * dir);

					if (r === startRank && b[two] === "") {
						add(from, two, { double: true });
					}
				}

				for (const df of [-1, 1]) {
					const nf = f + df;
					const nr = r + dir;

					if (nf < 0 || nf > 7 || nr < 0 || nr > 7) {
						continue;
					}

					const to = sq(nf, nr);

					if (b[to] !== "" && colorOf(b[to]) === them) {
						pawnMove(to);
					} else if (to === s.ep) {
						add(from, to, { enPassant: true, captured: me === "w" ? "p" : "P" });
					}
				}
			} else if (type === "N" || type === "K") {
				for (const d of type === "N" ? KNIGHT : KING) {
					const nf = f + d[1];
					const nr = r + d[0];

					if (nf < 0 || nf > 7 || nr < 0 || nr > 7) {
						continue;
					}

					const to = sq(nf, nr);

					if (colorOf(b[to]) !== me) {
						add(from, to);
					}
				}

				if (type === "K") {
					const rank = me === "w" ? 7 : 0;

					if (from === sq(4, rank) && !attacked(b, from, them)) {
						const k = me === "w" ? "K" : "k";
						const q = me === "w" ? "Q" : "q";
						const rook = me === "w" ? "R" : "r";

						if (s.castling.includes(k) && b[sq(5, rank)] === "" && b[sq(6, rank)] === "" && b[sq(7, rank)] === rook && !attacked(b, sq(5, rank), them) && !attacked(b, sq(6, rank), them)) {
							add(from, sq(6, rank), { castle: "k" });
						}

						if (s.castling.includes(q) && b[sq(3, rank)] === "" && b[sq(2, rank)] === "" && b[sq(1, rank)] === "" && b[sq(0, rank)] === rook && !attacked(b, sq(3, rank), them) && !attacked(b, sq(2, rank), them)) {
							add(from, sq(2, rank), { castle: "q" });
						}
					}
				}
			} else {
				const dirs = type === "B" ? BISHOP : type === "R" ? ROOK : BISHOP.concat(ROOK);

				for (const d of dirs) {
					let nf = f + d[1];
					let nr = r + d[0];

					while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) {
						const to = sq(nf, nr);

						if (b[to] === "") {
							add(from, to);
						} else {
							if (colorOf(b[to]) === them) {
								add(from, to);
							}

							break;
						}

						nf += d[1];
						nr += d[0];
					}
				}
			}
		}

		return moves;
	}

	function copy(s) {
		return { board: s.board.slice(), turn: s.turn, castling: s.castling, ep: s.ep, half: s.half, full: s.full };
	}

	function apply(s, m) {
		const n = copy(s);
		const b = n.board;
		const me = s.turn;

		b[m.to] = m.promo ? (me === "w" ? m.promo.toUpperCase() : m.promo) : b[m.from];
		b[m.from] = "";

		if (m.enPassant) {
			b[m.to + (me === "w" ? 8 : -8)] = "";
		}

		if (m.castle) {
			const rank = me === "w" ? 7 : 0;

			if (m.castle === "k") {
				b[sq(5, rank)] = b[sq(7, rank)];
				b[sq(7, rank)] = "";
			} else {
				b[sq(3, rank)] = b[sq(0, rank)];
				b[sq(0, rank)] = "";
			}
		}

		// castling rights vanish when a king or rook moves, or a rook is taken
		let rights = n.castling;

		function drop(letters) {
			for (const l of letters) {
				rights = rights.replace(l, "");
			}
		}

		if (m.piece === "K") drop("KQ");
		if (m.piece === "k") drop("kq");
		if (m.from === 63 || m.to === 63) drop("K");
		if (m.from === 56 || m.to === 56) drop("Q");
		if (m.from === 7 || m.to === 7) drop("k");
		if (m.from === 0 || m.to === 0) drop("q");

		n.castling = rights;

		n.ep = m.double ? (m.from + m.to) / 2 : -1;

		n.half = m.piece.toUpperCase() === "P" || m.captured ? 0 : s.half + 1;

		if (me === "b") {
			n.full++;
		}

		n.turn = me === "w" ? "b" : "w";

		return n;
	}

	function legalMoves(s) {
		return pseudoMoves(s).filter(function (m) {
			return !inCheck(apply(s, m), s.turn);
		});
	}

	function insufficient(s) {
		const rest = s.board.filter((p) => p !== "" && p.toUpperCase() !== "K");

		if (rest.length === 0) {
			return true;
		}

		if (rest.length === 1 && "BNbn".includes(rest[0])) {
			return true;
		}

		return false;
	}

	// "playing", "checkmate", "stalemate", "draw50", "insufficient"
	function status(s, moves) {
		moves = moves || legalMoves(s);

		if (moves.length === 0) {
			return inCheck(s, s.turn) ? "checkmate" : "stalemate";
		}

		if (insufficient(s)) {
			return "insufficient";
		}

		if (s.half >= 100) {
			return "draw50";
		}

		return "playing";
	}

	function perft(s, depth) {
		if (depth === 0) {
			return 1;
		}

		const moves = legalMoves(s);

		if (depth === 1) {
			return moves.length;
		}

		let total = 0;

		for (const m of moves) {
			total += perft(apply(s, m), depth - 1);
		}

		return total;
	}

	// text for a move, like "e4", "Nf3", "exd5", "O-O", "e8=Q+"
	function san(s, m, moves) {
		let text;

		if (m.castle) {
			text = m.castle === "k" ? "O-O" : "O-O-O";
		} else {
			const type = m.piece.toUpperCase();

			text = type === "P" ? (m.captured ? "abcdefgh"[m.from % 8] : "") : type;

			if (type !== "P") {
				// another piece of the same kind can reach the square: say which one
				const others = (moves || legalMoves(s)).filter((o) => o.from !== m.from && o.piece === m.piece && o.to === m.to);

				if (others.length) {
					const sameFile = others.some((o) => o.from % 8 === m.from % 8);
					const sameRank = others.some((o) => Math.floor(o.from / 8) === Math.floor(m.from / 8));

					text += !sameFile ? name(m.from)[0] : !sameRank ? name(m.from)[1] : name(m.from);
				}
			}

			if (m.captured) {
				text += "x";
			}

			text += name(m.to);

			if (m.promo) {
				text += "=" + m.promo.toUpperCase();
			}
		}

		const next = apply(s, m);

		const after = legalMoves(next);

		if (inCheck(next, next.turn)) {
			text += after.length ? "+" : "#";
		}

		return text;
	}

	// Engine

	const VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

	// small bonuses for pawns and knights near the centre, kings tucked away early
	function positional(piece, index) {
		const f = index % 8;
		const r = Math.floor(index / 8);

		const centre = 3.5 - Math.max(Math.abs(f - 3.5), Math.abs(r - 3.5));

		const type = piece.toLowerCase();

		if (type === "n" || type === "b") {
			return centre * 8;
		}

		if (type === "p") {
			const advance = piece === "P" ? 6 - r : r - 1;

			return advance * 6 + (f > 1 && f < 6 ? centre * 3 : 0);
		}

		if (type === "k") {
			return (r === 7 || r === 0 ? 10 : -10) + (f < 3 || f > 5 ? 10 : 0);
		}

		return 0;
	}

	function evaluate(s) {
		let score = 0;

		for (let i = 0; i < 64; i++) {
			const p = s.board[i];

			if (p === "") {
				continue;
			}

			const v = VALUE[p.toLowerCase()] + positional(p, i);

			score += colorOf(p) === "w" ? v : -v;
		}

		return score;
	}

	function orderMoves(moves) {
		return moves.sort(function (a, b) {
			const sa = (a.captured ? VALUE[a.captured.toLowerCase()] * 10 - VALUE[a.piece.toLowerCase()] : 0) + (a.promo ? 800 : 0);
			const sb = (b.captured ? VALUE[b.captured.toLowerCase()] * 10 - VALUE[b.piece.toLowerCase()] : 0) + (b.promo ? 800 : 0);

			return sb - sa;
		});
	}

	// score from the point of view of the side to move
	function negamax(s, depth, alpha, beta) {
		const moves = legalMoves(s);

		if (moves.length === 0) {
			return inCheck(s, s.turn) ? -100000 - depth : 0;
		}

		if (depth === 0) {
			const e = evaluate(s);

			return s.turn === "w" ? e : -e;
		}

		let best = -Infinity;

		for (const m of orderMoves(moves)) {
			const score = -negamax(apply(s, m), depth - 1, -beta, -alpha);

			if (score > best) {
				best = score;
			}

			if (best > alpha) {
				alpha = best;
			}

			if (alpha >= beta) {
				break;
			}
		}

		return best;
	}

	// level 1 plays loosely, 2 looks two moves ahead, 3 three
	function bestMove(s, level) {
		const moves = orderMoves(legalMoves(s));

		if (moves.length === 0) {
			return null;
		}

		const depth = level === 1 ? 1 : level === 2 ? 2 : 3;

		let bestScore = -Infinity;
		let best = [];

		for (const m of moves) {
			let score = -negamax(apply(s, m), depth - 1, -Infinity, Infinity);

			if (level === 1) {
				score += Math.random() * 150;
			}

			if (score > bestScore + 0.5) {
				bestScore = score;
				best = [m];
			} else if (Math.abs(score - bestScore) <= 0.5) {
				best.push(m);
			}
		}

		return best[Math.floor(Math.random() * best.length)];
	}

	return { START, fromFen, toFen, legalMoves, apply, inCheck, status, perft, san, bestMove, colorOf, name, sq };
})();
