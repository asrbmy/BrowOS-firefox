// BrowOS SDK for websites that run inside a BrowOS window.
// Add <script src="browos-sdk.js"></script> to your page, then:
//
//   BrowOS.ready.then(info => console.log(info.theme, info.accent));
//   BrowOS.notify("Done", "Your export finished");          // asks the person the first time
//   BrowOS.files.write("notes.txt", "hello");
//   BrowOS.files.read("notes.txt").then(console.log);
//
// Every call returns a promise. If the page is not inside BrowOS, BrowOS.available is false
// and the calls reject, so the page can fall back to normal behavior.

(function () {
	var inside = window.parent !== window;
	var pending = {};
	var next = 1;

	window.addEventListener("message", function (event) {
		var m = event.data;

		if (!m || m.browos !== 1 || !pending[m.id] || event.source !== window.parent) {
			return;
		}

		var p = pending[m.id];

		delete pending[m.id];

		clearTimeout(p.timer);

		m.ok ? p.resolve(m.result) : p.reject(new Error(m.error || "Failed"));
	});

	function call(method) {
		var args = Array.prototype.slice.call(arguments, 1);

		return new Promise(function (resolve, reject) {
			if (!inside) {
				reject(new Error("Not running inside BrowOS"));

				return;
			}

			var id = next++;

			// people take their time answering a permission question
			pending[id] = { resolve: resolve, reject: reject, timer: setTimeout(function () { delete pending[id]; reject(new Error("BrowOS didn't answer")); }, 120000) };

			window.parent.postMessage({ browos: 1, id: id, method: method, args: args }, "*");
		});
	}

	window.BrowOS = {
		available: inside,
		ready: call("hello"),
		notify: function (title, message) { return call("notify", title, message); },
		openApp: function (name) { return call("openApp", name); },
		keepAwake: function (on) { return call("keepAwake", on); },
		files: {
			write: function (name, text) { return call("files.write", name, text); },
			read: function (name) { return call("files.read", name); },
			list: function () { return call("files.list"); },
		},
	};
})();
