// Unit converter. Each unit has a factor to the base unit of its group.
const groups = {
	Length: { base: "m", u: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344 } },
	Mass: { base: "kg", u: { mg: 0.000001, g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237 } },
	Volume: { base: "l", u: { ml: 0.001, l: 1, "tsp": 0.00492892, "tbsp": 0.0147868, "fl oz": 0.0295735, cup: 0.236588, pint: 0.473176, gallon: 3.78541 } },
	Area: { base: "m²", u: { "cm²": 0.0001, "m²": 1, "km²": 1000000, "ft²": 0.09290304, acre: 4046.8564224, hectare: 10000 } },
	Speed: { base: "m/s", u: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, knot: 0.514444 } },
	Data: { base: "B", u: { bit: 0.125, B: 1, KB: 1000, MB: 1e6, GB: 1e9, TB: 1e12, KiB: 1024, MiB: 1048576, GiB: 1073741824 } },
	Time: { base: "s", u: { ms: 0.001, s: 1, min: 60, hour: 3600, day: 86400, week: 604800, year: 31557600 } },
	Temperature: { temp: true, u: { "°C": 1, "°F": 1, K: 1 } },
};
const tabs = document.getElementById("tabs");
const from = document.getElementById("from"), to = document.getElementById("to");
const fromU = document.getElementById("fromU"), toU = document.getElementById("toU");
let group = "Length";
function toC(v, u) { return u === "°F" ? (v - 32) * 5 / 9 : u === "K" ? v - 273.15 : v; }
function fromC(c, u) { return u === "°F" ? c * 9 / 5 + 32 : u === "K" ? c + 273.15 : c; }
function fmt(n) { if (!isFinite(n)) { return ""; } return String(parseFloat(n.toPrecision(10))); }
function calc() {
	const g = groups[group], v = parseFloat(from.value);
	if (isNaN(v)) { to.value = ""; return; }
	const out = g.temp ? fromC(toC(v, fromU.value), toU.value) : v * g.u[fromU.value] / g.u[toU.value];
	to.value = fmt(out);
	document.getElementById("note").textContent = g.temp && toC(v, fromU.value) < -273.15 ? "That is below absolute zero." : "";
}
function pick(name) {
	group = name;
	Array.from(tabs.children).forEach(function (b) { b.classList.toggle("on", b.textContent === name); b.setAttribute("aria-selected", b.textContent === name); });
	const units = Object.keys(groups[name].u);
	[fromU, toU].forEach(function (s, i) { s.textContent = ""; units.forEach(function (u) { s.add(new Option(u, u)); }); s.selectedIndex = Math.min(i ? 1 : 0, units.length - 1); });
	calc();
}
Object.keys(groups).forEach(function (name) { const b = document.createElement("button"); b.textContent = name; b.setAttribute("role", "tab"); b.addEventListener("click", function () { pick(name); }); tabs.appendChild(b); });
[from, fromU, toU].forEach(function (el) { el.addEventListener("input", calc); });
document.getElementById("swap").addEventListener("click", function () { const a = fromU.value; fromU.value = toU.value; toU.value = a; calc(); });
pick("Length");
