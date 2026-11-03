// Weather data for the Weather app and the desktop weather widget.
// Uses Open-Meteo (https://open-meteo.com): free, no account, no API key.

(function () {
	const PLACE_KEY = "browos-weather-place";
	const UNIT_KEY = "browos-weather-unit";

	// WMO weather codes -> text and a simple symbol
	const CODES = {
		0: ["Clear sky", "☀️"],
		1: ["Mostly clear", "🌤️"],
		2: ["Partly cloudy", "⛅"],
		3: ["Overcast", "☁️"],
		45: ["Fog", "🌫️"],
		48: ["Freezing fog", "🌫️"],
		51: ["Light drizzle", "🌦️"],
		53: ["Drizzle", "🌦️"],
		55: ["Heavy drizzle", "🌧️"],
		56: ["Freezing drizzle", "🌧️"],
		57: ["Freezing drizzle", "🌧️"],
		61: ["Light rain", "🌦️"],
		63: ["Rain", "🌧️"],
		65: ["Heavy rain", "🌧️"],
		66: ["Freezing rain", "🌧️"],
		67: ["Freezing rain", "🌧️"],
		71: ["Light snow", "🌨️"],
		73: ["Snow", "🌨️"],
		75: ["Heavy snow", "❄️"],
		77: ["Snow grains", "❄️"],
		80: ["Rain showers", "🌦️"],
		81: ["Rain showers", "🌧️"],
		82: ["Violent showers", "⛈️"],
		85: ["Snow showers", "🌨️"],
		86: ["Heavy snow showers", "❄️"],
		95: ["Thunderstorm", "⛈️"],
		96: ["Thunderstorm with hail", "⛈️"],
		99: ["Thunderstorm with hail", "⛈️"],
	};

	function describe(code) {
		return CODES[code] || ["Unknown", "🌡️"];
	}

	function getPlace() {
		try {
			const place = JSON.parse(localStorage.getItem(PLACE_KEY));

			if (place && typeof place.lat === "number" && typeof place.lon === "number") {
				return place;
			}
		} catch (error) {
			// no place saved
		}

		return null;
	}

	function setPlace(place) {
		localStorage.setItem(PLACE_KEY, JSON.stringify(place));
	}

	function getUnit() {
		return localStorage.getItem(UNIT_KEY) === "f" ? "f" : "c";
	}

	function setUnit(unit) {
		localStorage.setItem(UNIT_KEY, unit === "f" ? "f" : "c");
	}

	// the API always answers in Celsius and km/h, the display converts
	function temperature(celsius, unit) {
		const value = unit === "f" ? (celsius * 9) / 5 + 32 : celsius;

		return Math.round(value) + "°" + (unit === "f" ? "F" : "C");
	}

	function wind(kmh, unit) {
		return unit === "f" ? Math.round(kmh * 0.621371) + " mph" : Math.round(kmh) + " km/h";
	}

	async function getJson(url) {
		const controller = new AbortController();

		const timer = setTimeout(function () {
			controller.abort();
		}, 10000);

		try {
			const response = await fetch(url, { signal: controller.signal });

			if (!response.ok) {
				throw new Error("The weather service answered with " + response.status);
			}

			return await response.json();
		} finally {
			clearTimeout(timer);
		}
	}

	async function searchPlaces(name) {
		const data = await getJson(
			"https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=" +
				encodeURIComponent(name)
		);

		return (data.results || []).map(function (item) {
			return {
				name: item.name,
				region: [item.admin1, item.country].filter(Boolean).join(", "),
				lat: item.latitude,
				lon: item.longitude,
			};
		});
	}

	async function forecast(place) {
		const data = await getJson(
			"https://api.open-meteo.com/v1/forecast?latitude=" +
				encodeURIComponent(place.lat) +
				"&longitude=" +
				encodeURIComponent(place.lon) +
				"&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
				"&daily=weather_code,temperature_2m_max,temperature_2m_min" +
				"&forecast_days=5&timezone=auto"
		);

		if (!data.current || !data.daily) {
			throw new Error("The weather service sent something unexpected");
		}

		return data;
	}

	window.BrowWeather = {
		describe: describe,
		getPlace: getPlace,
		setPlace: setPlace,
		getUnit: getUnit,
		setUnit: setUnit,
		temperature: temperature,
		wind: wind,
		searchPlaces: searchPlaces,
		forecast: forecast,
	};
})();
