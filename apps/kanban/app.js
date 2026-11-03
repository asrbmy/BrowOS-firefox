// Kanban board, kept in localStorage
const KEY = "browos-kanban";
let data;
try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
if (!data || !Array.isArray(data.cols)) {
	data = { name: "My board", cols: [{ id: "c1", title: "To do", cards: [] }, { id: "c2", title: "Doing", cards: [] }, { id: "c3", title: "Done", cards: [] }] };
}
const board = document.getElementById("board");
const nameInput = document.getElementById("boardName");
let drag = null;
function uid() { return "k" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} }
function find(id) { for (const c of data.cols) { const i = c.cards.findIndex(function (k) { return k.id === id; }); if (i >= 0) { return { col: c, i: i }; } } return null; }
function render() {
	board.textContent = "";
	nameInput.value = data.name;
	data.cols.forEach(function (col) {
		const el = document.createElement("div");
		el.className = "kb-col";
		const head = document.createElement("div");
		head.className = "kb-head";
		const title = document.createElement("input");
		title.value = col.title;
		title.setAttribute("aria-label", "Column title");
		title.addEventListener("change", function () { col.title = title.value.trim() || "Untitled"; save(); });
		const del = document.createElement("button");
		del.textContent = "×";
		del.title = "Delete column";
		del.addEventListener("click", function () {
			if (col.cards.length && !confirm("Delete this column and its " + col.cards.length + " card(s)?")) { return; }
			data.cols = data.cols.filter(function (c) { return c !== col; }); save(); render();
		});
		head.append(title, del);
		const list = document.createElement("div");
		list.className = "kb-cards";
		col.cards.forEach(function (card) {
			const c = document.createElement("div");
			c.className = "kb-card";
			c.draggable = true;
			const t = document.createElement("span");
			t.textContent = card.text;
			t.contentEditable = "plaintext-only";
			t.addEventListener("blur", function () { card.text = t.textContent.trim() || card.text; save(); });
			t.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); t.blur(); } });
			const x = document.createElement("button");
			x.textContent = "×"; x.title = "Delete card";
			x.addEventListener("click", function () { col.cards = col.cards.filter(function (k) { return k !== card; }); save(); render(); });
			c.append(t, x);
			c.addEventListener("dragstart", function (e) { drag = card.id; c.classList.add("drag"); e.dataTransfer.setData("text/plain", card.id); e.dataTransfer.effectAllowed = "move"; });
			c.addEventListener("dragend", function () { drag = null; c.classList.remove("drag"); });
			list.appendChild(c);
		});
		const add = document.createElement("button");
		add.className = "kb-add";
		add.textContent = "+ Add card";
		add.addEventListener("click", function () {
			const text = prompt("Card text");
			if (text && text.trim()) { col.cards.push({ id: uid(), text: text.trim() }); save(); render(); }
		});
		el.addEventListener("dragover", function (e) { if (drag) { e.preventDefault(); el.classList.add("over"); } });
		el.addEventListener("dragleave", function () { el.classList.remove("over"); });
		el.addEventListener("drop", function (e) {
			e.preventDefault(); el.classList.remove("over");
			const from = drag && find(drag);
			if (!from) { return; }
			const card = from.col.cards.splice(from.i, 1)[0];
			// drop above the card under the pointer, otherwise at the end
			const cards = Array.from(list.children);
			let index = col.cards.length;
			for (let i = 0; i < cards.length; i++) { const r = cards[i].getBoundingClientRect(); if (e.clientY < r.top + r.height / 2) { index = i; break; } }
			if (from.col === col && from.i < index) { index--; }
			col.cards.splice(index, 0, card);
			save(); render();
		});
		el.append(head, list, add);
		board.appendChild(el);
	});
}
nameInput.addEventListener("change", function () { data.name = nameInput.value.trim() || "My board"; save(); });
document.getElementById("addCol").addEventListener("click", function () { data.cols.push({ id: uid(), title: "New column", cards: [] }); save(); render(); });
render();
