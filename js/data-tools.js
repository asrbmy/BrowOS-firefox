// Backup: export and import everything BrowOS keeps in this browser

const exportButton = document.getElementById("exportButton");
const importInput = document.getElementById("importInput");
const dataMessage = document.getElementById("dataMessage");

function dataFeedback(text, good) {
	dataMessage.textContent = text;

	dataMessage.className = "data-message" + (good ? " good" : "");
}

exportButton.addEventListener("click", function () {
	const data = {};

	for (let index = 0; index < localStorage.length; index++) {
		const key = localStorage.key(index);

		data[key] = localStorage.getItem(key);
	}

	const backup = {
		app: "BrowOS",
		version: 1,
		exportedAt: new Date().toISOString(),
		data: data,
	};

	const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });

	const link = document.createElement("a");

	link.href = URL.createObjectURL(blob);

	link.download = "browos-backup-" + new Date().toISOString().slice(0, 10) + ".json";

	document.body.appendChild(link);

	link.click();

	link.remove();

	setTimeout(function () {
		URL.revokeObjectURL(link.href);
	}, 10000);

	dataFeedback(
		Object.keys(data).length + " items saved. Notepad's snapshot history is not included.",
		true
	);
});

importInput.addEventListener("change", function () {
	const file = importInput.files[0];

	importInput.value = "";

	if (!file) {
		return;
	}

	if (file.size > 20 * 1024 * 1024) {
		dataFeedback("That file is too big to be a BrowOS backup.");

		return;
	}

	const reader = new FileReader();

	reader.onload = function () {
		let backup;

		try {
			backup = JSON.parse(reader.result);
		} catch (error) {
			dataFeedback("That file isn't a BrowOS backup (it can't be read).");

			return;
		}

		const valid =
			backup &&
			backup.app === "BrowOS" &&
			backup.data &&
			typeof backup.data === "object" &&
			!Array.isArray(backup.data) &&
			Object.keys(backup.data).every(function (key) {
				return typeof backup.data[key] === "string";
			});

		if (!valid) {
			dataFeedback("That file isn't a BrowOS backup.");

			return;
		}

		const count = Object.keys(backup.data).length;

		if (
			!confirm(
				"Replace your current BrowOS settings and data with this backup (" +
					count +
					" items)? Your current ones will be lost."
			)
		) {
			return;
		}

		// a copy of what is there now, in case the backup doesn't fit
		const before = {};

		for (let index = 0; index < localStorage.length; index++) {
			const key = localStorage.key(index);

			before[key] = localStorage.getItem(key);
		}

		try {
			localStorage.clear();

			Object.keys(backup.data).forEach(function (key) {
				localStorage.setItem(key, backup.data[key]);
			});
		} catch (error) {
			try {
				localStorage.clear();

				Object.keys(before).forEach(function (key) {
					localStorage.setItem(key, before[key]);
				});
			} catch (restoreError) {
				// the old data was just there, so it fits again
			}

			dataFeedback("The backup doesn't fit in this browser's storage, so nothing was changed.");

			return;
		}

		// everything starts again from the restored data
		sessionStorage.removeItem("browos-locked");

		location.reload();
	};

	reader.onerror = function () {
		dataFeedback("That file couldn't be read.");
	};

	reader.readAsText(file);
});
