// To-Do

const KEY = "browos-todo";

const addForm = document.getElementById("addForm");
const addInput = document.getElementById("addInput");
const addDate = document.getElementById("addDate");
const filters = document.getElementById("filters");
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const count = document.getElementById("count");
const clearDone = document.getElementById("clearDone");

let tasks = [];

try {
	const saved = JSON.parse(localStorage.getItem(KEY));

	if (Array.isArray(saved)) {
		tasks = saved.filter(function (task) {
			return task && typeof task.text === "string";
		});
	}
} catch (error) {
	tasks = [];
}

let filter = "all";

function save() {
	localStorage.setItem(KEY, JSON.stringify(tasks));
}

function today() {
	const now = new Date();

	return (
		now.getFullYear() +
		"-" +
		String(now.getMonth() + 1).padStart(2, "0") +
		"-" +
		String(now.getDate()).padStart(2, "0")
	);
}

function render() {
	list.innerHTML = "";

	const shown = tasks.filter(function (task) {
		if (filter === "open") {
			return !task.done;
		}

		if (filter === "done") {
			return task.done;
		}

		return true;
	});

	shown.forEach(function (task) {
		const item = document.createElement("li");

		item.className = "todo-item" + (task.done ? " done" : "");

		const box = document.createElement("input");

		box.type = "checkbox";
		box.checked = task.done;

		box.addEventListener("change", function () {
			task.done = box.checked;

			save();
			render();
		});

		const text = document.createElement("span");

		text.className = "todo-text";
		text.textContent = task.text;

		item.append(box, text);

		if (task.due) {
			const due = document.createElement("span");

			due.className = "todo-due" + (!task.done && task.due < today() ? " late" : "");
			due.textContent = task.due;

			item.appendChild(due);
		}

		const remove = document.createElement("button");

		remove.className = "todo-remove";
		remove.textContent = "×";
		remove.title = "Remove";

		remove.addEventListener("click", function () {
			tasks = tasks.filter(function (other) {
				return other !== task;
			});

			save();
			render();
		});

		item.appendChild(remove);

		list.appendChild(item);
	});

	empty.hidden = shown.length > 0;

	const open = tasks.filter(function (task) {
		return !task.done;
	}).length;

	count.textContent = open + (open === 1 ? " task left" : " tasks left");

	clearDone.hidden = tasks.every(function (task) {
		return !task.done;
	});
}

addForm.addEventListener("submit", function (event) {
	event.preventDefault();

	const text = addInput.value.trim();

	if (!text) {
		return;
	}

	tasks.unshift({
		text: text,
		done: false,
		due: addDate.value || "",
	});

	addInput.value = "";
	addDate.value = "";

	save();
	render();
});

filters.addEventListener("click", function (event) {
	const button = event.target.closest("button[data-filter]");

	if (!button) {
		return;
	}

	filter = button.dataset.filter;

	filters.querySelectorAll("button[data-filter]").forEach(function (item) {
		item.classList.toggle("on", item === button);
	});

	render();
});

clearDone.addEventListener("click", function () {
	tasks = tasks.filter(function (task) {
		return !task.done;
	});

	save();
	render();
});

// another window of BrowOS (or a widget) changed the list
window.addEventListener("storage", function (event) {
	if (event.key === KEY) {
		try {
			tasks = JSON.parse(event.newValue) || [];
		} catch (error) {
			tasks = [];
		}

		render();
	}
});

render();
