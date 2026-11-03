// A small syntax colorer: comments, strings, numbers and keywords for common languages.

window.BrowHighlight = (function () {
	const JS = "break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await true false null undefined";
	const PY = "and as assert break class continue def del elif else except finally for from global if import in is lambda None nonlocal not or pass raise return try while with yield True False async await self";
	const C = "auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while class public private protected new delete template namespace using bool true false nullptr include define";
	const GO = "break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var true false nil fn let mut pub impl use mod match loop enum trait where";
	const SQL = "select from where insert into values update set delete create table drop alter join left right inner outer on group by order having limit as and or not null primary key distinct union";
	const SH = "if then else elif fi for while do done case esac function in echo export local return exit";

	const languages = {
		js: { kw: JS, line: "//", block: true, strings: "\"'`" },
		ts: { kw: JS + " interface type enum implements private public protected readonly", line: "//", block: true, strings: "\"'`" },
		json: { kw: "true false null", strings: "\"" },
		css: { kw: "", block: true, strings: "\"'", css: true },
		html: { markup: true },
		xml: { markup: true },
		py: { kw: PY, line: "#", strings: "\"'" },
		c: { kw: C, line: "//", block: true, strings: "\"'" },
		go: { kw: GO, line: "//", block: true, strings: "\"'`" },
		sql: { kw: SQL, line: "--", block: true, strings: "\"'", nocase: true },
		sh: { kw: SH, line: "#", strings: "\"'" },
		yaml: { kw: "true false null", line: "#", strings: "\"'" },
		md: {},
		txt: {},
	};

	const alias = { jsx: "js", mjs: "js", tsx: "ts", java: "c", cpp: "c", h: "c", cs: "c", rs: "go", htm: "html", svg: "xml", yml: "yaml", markdown: "md", bash: "sh", zsh: "sh", scss: "css" };

	function escape(text) {
		return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}

	function span(kind, text) {
		return '<span class="tok-' + kind + '">' + escape(text) + "</span>";
	}

	function languageFor(name) {
		const dot = String(name).lastIndexOf(".");

		const ext = dot >= 0 ? String(name).slice(dot + 1).toLowerCase() : "";

		return alias[ext] || ext;
	}

	function markup(code) {
		return code.replace(/(<!--[\s\S]*?-->)|(<\/?[A-Za-z][^>]*>)|([^<]+)|(<)/g, function (all, comment, tag, text, lone) {
			if (comment) {
				return span("com", comment);
			}

			if (tag) {
				return escape(tag).replace(/^(&lt;\/?)([\w:-]+)/, function (m, open, name) {
					return open + '<span class="tok-tag">' + name + "</span>";
				}).replace(/(\s)([\w:-]+)(=)/g, '$1<span class="tok-kw">$2</span>$3').replace(/(&quot;[^&]*?&quot;|"[^"]*"|'[^']*')/g, function (m) {
					return '<span class="tok-str">' + m + "</span>";
				});
			}

			return escape(text || lone);
		});
	}

	function colorize(code, name) {
		const lang = languages[languageFor(name)];

		if (!lang) {
			return escape(code);
		}

		if (lang.markup) {
			return markup(code);
		}

		const parts = [];

		if (lang.block) {
			parts.push("\\/\\*[\\s\\S]*?(?:\\*\\/|$)");
		}

		if (lang.line) {
			parts.push(lang.line.replace(/[/#-]/g, "\\$&") + ".*");
		}

		const q = (lang.strings || "").split("").map(function (quote) {
			return quote === "`" ? "`[\\s\\S]*?(?:`|$)" : quote + "(?:\\\\.|[^" + quote + "\\\\\\n])*" + quote + "?";
		});

		parts.push.apply(parts, q);

		parts.push("\\b\\d[\\d_.]*(?:e[+-]?\\d+)?\\b|\\b0x[0-9a-f]+\\b");

		const words = (lang.kw || "").split(" ").filter(Boolean);

		if (words.length) {
			parts.push("\\b(?:" + words.join("|") + ")\\b");
		}

		const pattern = new RegExp("(" + parts.join(")|(") + ")", "g" + (lang.nocase ? "i" : ""));

		let out = "";
		let last = 0;
		let match;

		while ((match = pattern.exec(code)) !== null) {
			if (match[0] === "") {
				pattern.lastIndex++;

				continue;
			}

			out += escape(code.slice(last, match.index));

			const text = match[0];

			let kind = "kw";

			if (/^(\/\*|\/\/|#|--)/.test(text) && (lang.block || lang.line)) {
				kind = text[0] === "#" && !lang.line ? "num" : "com";
			} else if (/^["'`]/.test(text)) {
				kind = "str";
			} else if (/^\d/.test(text)) {
				kind = "num";
			}

			out += span(kind, text);

			last = match.index + text.length;
		}

		return out + escape(code.slice(last));
	}

	return { colorize: colorize, languageFor: languageFor };
})();
