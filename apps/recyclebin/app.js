// Recycle Bin: shows what was removed from BrowOS and puts it back on request

const list = document.getElementById("list");
const empty = document.getElementById("empty");
const summary = document.getElementById("summary");
const emptyButton = document.getElementById("emptyButton");

function api() {
	return window.browos && window.browos.bin ? window.browos.bin : null;
}

function ago(time) {
	const minutes = Math.floor((Date.now() - time) / 60000);

	if (minutes < 1) {
		return "just now";
	}

	if (minutes < 60) {
		return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
	}

	const hours = Math.floor(minutes / 60);

	if (hours < 24) {
		return hours + (hours === 1 ? " hour ago" : " hours ago");
	}

	const days = Math.floor(hours / 24);

	return days + (days === 1 ? " day ago" : " days ago");
}

function render() {
	const bin = api();

	list.innerHTML = "";

	if (!bin) {
		summary.textContent = "The BrowOS desktop isn't reachable from here.";

		empty.hidden = true;

		emptyButton.disabled = true;

		return;
	}

	const items = bin.items();

	summary.textContent = items.length + (items.length === 1 ? " item" : " items");

	empty.hidden = items.length > 0;

	emptyButton.disabled = items.length === 0;

	items.forEach(function (item) {
		const row = document.createElement("li");

		row.className = "bin-item";

		const icon = document.createElement("img");

		icon.alt = "";
		icon.src = item.icon;

		icon.addEventListener(
			"error",
			function () {
				icon.style.visibility = "hidden";
			},
			{ once: true }
		);

		const info = document.createElement("div");

		info.className = "bin-info";

		const name = document.createElement("div");

		name.className = "bin-name";
		name.textContent = item.name;

		const when = document.createElement("div");

		when.className = "bin-when muted";
		when.textContent = "Removed " + ago(item.removedAt);

		info.append(name, when);

		const restore = document.createElement("button");

		restore.className = "primary";
		restore.textContent = "Restore";

		restore.addEventListener("click", function () {
			bin.restore(item.id);

			render();
		});

		const remove = document.createElement("button");

		remove.className = "bin-delete";
		remove.textContent = "Delete";

		remove.addEventListener("click", function () {
			const question = item.custom
				? "Delete " + item.name + " for good? A website shortcut can't be brought back after this."
				: "Take " + item.name + " out of the Recycle Bin? You can still add it again from BrowStore.";

			if (confirm(question)) {
				bin.remove(item.id);

				render();
			}
		});

		row.append(icon, info, restore, remove);

		list.appendChild(row);
	});
}

emptyButton.addEventListener("click", function () {
	const bin = api();

	if (bin && confirm("Delete everything in the Recycle Bin for good?")) {
		bin.empty();

		render();
	}
});

// the bin changed somewhere else (an app was removed while this window is open)
window.addEventListener("focus", render);

if (window.parent !== window) {
	window.parent.document.addEventListener("bin-changed", render);
}

render();
