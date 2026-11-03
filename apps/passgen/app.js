// Passwords are made in this window with crypto.getRandomValues. Nothing is saved or sent.
const $ = function (id) { return document.getElementById(id); };
function rand(n) { // unbiased random integer below n
	const max = Math.floor(0x100000000 / n) * n, a = new Uint32Array(1);
	do { crypto.getRandomValues(a); } while (a[0] >= max);
	return a[0] % n;
}
function generate() {
	let sets = [];
	const skip = $("similar").checked ? /[0O1lI|]/g : null;
	const add = function (on, chars) { if (on) { sets.push(skip ? chars.replace(skip, "") : chars); } };
	add($("lower").checked, "abcdefghijklmnopqrstuvwxyz");
	add($("upper").checked, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
	add($("digits").checked, "0123456789");
	add($("symbols").checked, "!@#$%^&*()-_=+[]{};:,.?/");
	if (!sets.length) { $("out").value = ""; $("strength").textContent = "Pick at least one kind of character."; $("bar").style.width = "0"; return; }
	const len = Math.max(+$("len").value, sets.length), all = sets.join("");
	const chars = sets.map(function (s) { return s[rand(s.length)]; }); // one from every chosen kind
	while (chars.length < len) { chars.push(all[rand(all.length)]); }
	for (let i = chars.length - 1; i > 0; i--) { const j = rand(i + 1); const t = chars[i]; chars[i] = chars[j]; chars[j] = t; }
	$("out").value = chars.join("");
	const bits = len * Math.log2(all.length);
	const level = bits < 40 ? ["Weak", "#e5534b", 25] : bits < 64 ? ["Fair", "#e0a030", 50] : bits < 100 ? ["Strong", "#4caf50", 75] : ["Very strong", "#2196f3", 100];
	$("strength").textContent = level[0] + " (about " + Math.round(bits) + " bits)";
	$("bar").style.width = level[2] + "%"; $("bar").style.background = level[1];
}
$("len").addEventListener("input", function () { $("lenv").textContent = $("len").value; generate(); });
["lower", "upper", "digits", "symbols", "similar"].forEach(function (id) { $(id).addEventListener("change", generate); });
$("gen").addEventListener("click", generate);
$("copy").addEventListener("click", function () {
	const done = function () { $("copy").textContent = "Copied"; setTimeout(function () { $("copy").textContent = "Copy"; }, 1200); };
	if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText($("out").value).then(done, function () { $("out").select(); document.execCommand("copy"); done(); }); }
	else { $("out").select(); document.execCommand("copy"); done(); }
});
generate();
