const WORDS = "the of and to in is you that it he was for on are as with his they at be this from have or by one had not but what all were when we there can an your which their said if do will each about how up out them then she many some so these would other into has more her two like him see time could no make than first been its who now people my made over did down only way find use may water long little very after words called just where most know get through back much before go good new write our used me man too any day same right look think also around another came come work three word must because does part even place well such here take why help put different away again off went old number great tell men say small every found still between name should home big give air line set own under read last never us left end along while might next sound below saw something thought both few those always looked show large often together asked house don't world going want school important until form food keep children feet land side without boy once animal life enough took sometimes four head above kind began almost live page got earth need far hand high year mother light country father let night picture being study second soon story since white ever paper hard near sentence better best across during today however sure knew try told young sun thing whole hear example heard several change answer room sea against top turned learn point city play toward five using himself usually".split(" ");
const $ = function (id) { return document.getElementById(id); };
let target, pos, started, timer, endAt, typed, errors, spans;
function words(n) { const out = []; for (let i = 0; i < n; i++) { const a = new Uint32Array(1); crypto.getRandomValues(a); out.push(WORDS[a[0] % WORDS.length]); } return out.join(" "); }
function best() { try { return +localStorage.getItem("browos-typing-best-" + $("dur").value) || 0; } catch (e) { return 0; } }
function reset() {
	clearInterval(timer); started = false; pos = 0; typed = 0; errors = 0;
	target = words(220);
	$("text").textContent = "";
	spans = target.split("").map(function (ch) { const s = document.createElement("span"); s.textContent = ch; $("text").appendChild(s); return s; });
	spans[0].className = "cur";
	$("inp").value = ""; $("inp").disabled = false; $("inp").focus();
	$("left").textContent = $("dur").value; $("wpm").textContent = "0 wpm"; $("acc").textContent = "100%";
	$("best").textContent = best() ? "Best " + best() + " wpm" : "";
	document.querySelector(".ty").classList.remove("done");
}
function stats() {
	const secs = Math.max(1, (+$("dur").value) - Math.max(0, (endAt - Date.now()) / 1000));
	const wpm = Math.round((pos - errorsInText()) / 5 / (secs / 60));
	return Math.max(0, wpm);
}
function errorsInText() { let n = 0; for (let i = 0; i < pos; i++) { if (spans[i].className.indexOf("bad") >= 0) { n++; } } return n; }
function finish() {
	clearInterval(timer); $("inp").disabled = true; document.querySelector(".ty").classList.add("done");
	const w = stats(); $("wpm").textContent = w + " wpm";
	if (w > best()) { try { localStorage.setItem("browos-typing-best-" + $("dur").value, w); } catch (e) {} $("best").textContent = "New best!"; }
}
$("inp").addEventListener("input", function () {
	if (!started) { started = true; endAt = Date.now() + (+$("dur").value) * 1000; timer = setInterval(function () { const l = Math.ceil((endAt - Date.now()) / 1000); $("left").textContent = Math.max(0, l); $("wpm").textContent = stats() + " wpm"; if (l <= 0) { finish(); } }, 250); }
	const v = $("inp").value;
	$("inp").value = "";
	for (const ch of v) {
		if (pos >= target.length) { break; }
		typed++;
		const ok = ch === target[pos];
		if (!ok) { errors++; }
		spans[pos].className = ok ? "ok" : "bad";
		pos++;
	}
	if (pos < spans.length) { spans[pos].className = "cur"; spans[pos].scrollIntoView({ block: "center" }); }
	$("acc").textContent = typed ? Math.round((typed - errors) / typed * 100) + "%" : "100%";
});
// backspace steps back one character
$("inp").addEventListener("keydown", function (e) {
	if (e.key === "Backspace" && started && pos > 0) { e.preventDefault(); if (pos < spans.length) { spans[pos].className = ""; } pos--; spans[pos].className = "cur"; }
	if (e.key === "Escape") { reset(); }
});
$("again").addEventListener("click", reset);
$("dur").addEventListener("change", reset);
reset();
