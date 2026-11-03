// Weather app

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const unitButton = document.getElementById("unitButton");
const results = document.getElementById("results");
const message = document.getElementById("message");
const now = document.getElementById("now");
const days = document.getElementById("days");

let place = BrowWeather.getPlace();
let unit = BrowWeather.getUnit();
let lastData = null;

function say(text) {
	message.textContent = text;
}

function showWeather() {
	if (!lastData || !place) {
		now.hidden = true;
		days.hidden = true;

		return;
	}

	const current = lastData.current;

	const info = BrowWeather.describe(current.weather_code);

	document.getElementById("place").textContent = place.name;
	document.getElementById("icon").textContent = info[1];
	document.getElementById("temp").textContent = BrowWeather.temperature(
		current.temperature_2m,
		unit
	);
	document.getElementById("desc").textContent = info[0];

	document.getElementById("details").textContent =
		"Feels like " +
		BrowWeather.temperature(current.apparent_temperature, unit) +
		"  ·  Humidity " +
		Math.round(current.relative_humidity_2m) +
		"%  ·  Wind " +
		BrowWeather.wind(current.wind_speed_10m, unit);

	now.hidden = false;

	days.innerHTML = "";

	lastData.daily.time.forEach(function (date, index) {
		const card = document.createElement("div");

		card.className = "weather-day";

		// the date has no time zone, so build it from its parts
		const parts = date.split("-").map(Number);

		const name = new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString([], {
			weekday: "short",
		});

		const dayInfo = BrowWeather.describe(lastData.daily.weather_code[index]);

		const title = document.createElement("div");

		title.textContent = index === 0 ? "Today" : name;

		const icon = document.createElement("div");

		icon.className = "weather-day-icon";
		icon.textContent = dayInfo[1];
		icon.title = dayInfo[0];

		const high = document.createElement("div");

		high.textContent = BrowWeather.temperature(lastData.daily.temperature_2m_max[index], unit);

		const low = document.createElement("div");

		low.className = "weather-day-low";
		low.textContent = BrowWeather.temperature(lastData.daily.temperature_2m_min[index], unit);

		card.append(title, icon, high, low);

		days.appendChild(card);
	});

	days.hidden = false;
}

async function load() {
	if (!place) {
		say("Search for a city to see its weather.");

		return;
	}

	say("Loading the weather...");

	try {
		lastData = await BrowWeather.forecast(place);

		say("");

		showWeather();
	} catch (error) {
		lastData = null;

		showWeather();

		say("Couldn't load the weather. Check your internet connection and try again.");
	}
}

searchForm.addEventListener("submit", async function (event) {
	event.preventDefault();

	const name = searchInput.value.trim();

	if (!name) {
		return;
	}

	say("Searching...");

	results.hidden = true;

	try {
		const found = await BrowWeather.searchPlaces(name);

		if (found.length === 0) {
			say("No city found with that name.");

			return;
		}

		say("");

		results.innerHTML = "";

		found.forEach(function (item) {
			const button = document.createElement("button");

			button.type = "button";
			button.textContent = item.name;

			const region = document.createElement("small");

			region.textContent = item.region;

			button.appendChild(region);

			button.addEventListener("click", function () {
				place = { name: item.name, lat: item.lat, lon: item.lon };

				BrowWeather.setPlace(place);

				results.hidden = true;

				searchInput.value = "";

				load();
			});

			results.appendChild(button);
		});

		results.hidden = false;
	} catch (error) {
		say("Couldn't search right now. Check your internet connection and try again.");
	}
});

function updateUnitButton() {
	unitButton.textContent = unit === "f" ? "°F" : "°C";
}

unitButton.addEventListener("click", function () {
	unit = unit === "f" ? "c" : "f";

	BrowWeather.setUnit(unit);

	updateUnitButton();

	showWeather();
});

updateUnitButton();

load();
