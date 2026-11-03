// A small calculator for typed expressions: numbers, + - * / % ^ and parentheses.
// It reads the text itself, so it never runs what was typed as code.
// Used by the Start menu search and by the Terminal.

function safeCalculate(text) {
	const tokens = String(text).match(/\d+\.?\d*|\.\d+|[-+*/%^()]|\S/g) || [];

	let position = 0;

	function peek() {
		return tokens[position];
	}

	function take() {
		return tokens[position++];
	}

	function parseValue() {
		const token = take();

		if (token === undefined) {
			throw new Error("The expression ended too early");
		}

		if (token === "(") {
			const value = parseSum();

			if (take() !== ")") {
				throw new Error("Missing )");
			}

			return value;
		}

		if (token === "-") {
			return -parsePower();
		}

		if (token === "+") {
			return parsePower();
		}

		const number = Number(token);

		if (Number.isNaN(number)) {
			throw new Error("Can't read '" + token + "'");
		}

		return number;
	}

	function parsePower() {
		const base = parseValue();

		if (peek() === "^") {
			take();

			// right to left: 2^3^2 = 2^(3^2)
			return Math.pow(base, parsePower());
		}

		return base;
	}

	function parseProduct() {
		let value = parsePower();

		while (peek() === "*" || peek() === "/" || peek() === "%") {
			const operator = take();

			const right = parsePower();

			if (operator === "*") {
				value *= right;
			} else if (operator === "/") {
				value /= right;
			} else {
				value %= right;
			}
		}

		return value;
	}

	function parseSum() {
		let value = parseProduct();

		while (peek() === "+" || peek() === "-") {
			const operator = take();

			const right = parseProduct();

			value = operator === "+" ? value + right : value - right;
		}

		return value;
	}

	const result = parseSum();

	if (position < tokens.length) {
		throw new Error("Can't read '" + tokens[position] + "'");
	}

	return result;
}
