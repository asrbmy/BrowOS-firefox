// Custom dropdowns

// the real <select> stays hidden and does the work,
// this just draws a dropdown that keeps the BrowOS cursor and style

document.querySelectorAll(".setting-row select").forEach(function (select) {
	const dropdown = document.createElement("div");

	const button = document.createElement("button");

	const list = document.createElement("div");

	dropdown.className = "dropdown";
	button.className = "dropdown-button";
	list.className = "dropdown-list";

	function updateButton() {
		button.textContent = select.options[select.selectedIndex].textContent;
	}

	[...select.options].forEach(function (option) {
		const item = document.createElement("div");

		item.className = "dropdown-item";

		item.textContent = option.textContent;

		item.addEventListener("click", function () {
			select.value = option.value;

			select.dispatchEvent(new Event("change"));

			dropdown.classList.remove("open");
		});

		list.appendChild(item);
	});

	button.addEventListener("click", function () {
		const wasOpen = dropdown.classList.contains("open");

		document.querySelectorAll(".dropdown.open").forEach(function (other) {
			other.classList.remove("open");
		});

		if (wasOpen) {
			return;
		}

		dropdown.classList.add("open");

		// open upwards if there is no room below

		const area = dropdown.closest(".settings-pages") || document.body;

		const spaceBelow =
			area.getBoundingClientRect().bottom - button.getBoundingClientRect().bottom;

		if (spaceBelow < list.offsetHeight + 10) {
			dropdown.classList.add("up");
		} else {
			dropdown.classList.remove("up");
		}
	});

	select.addEventListener("change", updateButton);

	select.hidden = true;

	select.after(dropdown);

	dropdown.append(button, list);

	updateButton();
});

// close dropdowns when clicking somewhere else

document.addEventListener("pointerdown", function (event) {
	if (!event.target.closest(".dropdown")) {
		document.querySelectorAll(".dropdown.open").forEach(function (dropdown) {
			dropdown.classList.remove("open");
		});
	}
});
