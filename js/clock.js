// Clock

function updateClock() {
	const now = new Date();

	const time = now.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});

	const date = now.toLocaleDateString([], {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	document.getElementById("clock").textContent = time;

	document.getElementById("date").textContent = date;
}

updateClock();

setInterval(updateClock, 1000);
