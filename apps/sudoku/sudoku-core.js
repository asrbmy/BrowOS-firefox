// Sudoku puzzles: a solved grid, then cells are removed while the answer stays unique.

window.BrowSudoku = (function () {
	function shuffle(list) {
		for (let i = list.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));

			[list[i], list[j]] = [list[j], list[i]];
		}

		return list;
	}

	function candidates(grid, index) {
		const row = Math.floor(index / 9);
		const col = index % 9;

		const used = new Set();

		for (let i = 0; i < 9; i++) {
			used.add(grid[row * 9 + i]);
			used.add(grid[i * 9 + col]);
		}

		const br = row - (row % 3);
		const bc = col - (col % 3);

		for (let r = 0; r < 3; r++) {
			for (let c = 0; c < 3; c++) {
				used.add(grid[(br + r) * 9 + bc + c]);
			}
		}

		const out = [];

		for (let n = 1; n <= 9; n++) {
			if (!used.has(n)) {
				out.push(n);
			}
		}

		return out;
	}

	// fills a grid completely, trying the options of the most restricted cell in random order
	function fill(grid) {
		let best = -1;
		let bestOptions = null;

		for (let i = 0; i < 81; i++) {
			if (grid[i] === 0) {
				const options = candidates(grid, i);

				if (options.length === 0) {
					return false;
				}

				if (bestOptions === null || options.length < bestOptions.length) {
					best = i;
					bestOptions = options;
				}
			}
		}

		if (best < 0) {
			return true;
		}

		for (const n of shuffle(bestOptions)) {
			grid[best] = n;

			if (fill(grid)) {
				return true;
			}
		}

		grid[best] = 0;

		return false;
	}

	function countSolutions(puzzle, limit) {
		const copy = puzzle.slice();

		let count = 0;

		function walk() {
			let best = -1;
			let bestOptions = null;

			for (let i = 0; i < 81; i++) {
				if (copy[i] === 0) {
					const options = candidates(copy, i);

					if (options.length === 0) {
						return;
					}

					if (bestOptions === null || options.length < bestOptions.length) {
						best = i;
						bestOptions = options;
					}
				}
			}

			if (best < 0) {
				count++;

				return;
			}

			for (const n of bestOptions) {
				copy[best] = n;

				walk();

				copy[best] = 0;

				if (count >= limit) {
					return;
				}
			}
		}

		walk();

		return count;
	}

	function solvedGrid() {
		const grid = new Array(81).fill(0);

		fill(grid);

		return grid;
	}

	const CLUES = { easy: 40, medium: 32, hard: 26 };

	function generate(level) {
		const solution = solvedGrid();

		const puzzle = solution.slice();

		const order = shuffle(Array.from({ length: 81 }, (_, i) => i));

		let clues = 81;

		const target = CLUES[level] || CLUES.medium;

		for (const index of order) {
			if (clues <= target) {
				break;
			}

			const keep = puzzle[index];

			puzzle[index] = 0;

			if (countSolutions(puzzle, 2) !== 1) {
				puzzle[index] = keep;
			} else {
				clues--;
			}
		}

		return { puzzle: puzzle, solution: solution };
	}

	return { generate: generate, countSolutions: countSolutions, candidates: candidates };
})();
