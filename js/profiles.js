// Profiles
// Each profile has its own settings, notes, tasks, app data and files.
// The data of the profile in use lives in localStorage as always; the others are kept as
// snapshots in IndexedDB and swapped in when you switch. The page then reloads.

const PROFILE_META_KEY = "browos-profiles-meta";

function profileMeta() {
	try {
		const meta = JSON.parse(localStorage.getItem(PROFILE_META_KEY));

		if (meta && Array.isArray(meta.list) && meta.list.length && meta.list.some((p) => p.id === meta.current)) {
			return meta;
		}
	} catch (error) {
		// falls through to the default
	}

	return { current: "default", list: [{ id: "default", name: "Main" }] };
}

function saveProfileMeta(meta) {
	localStorage.setItem(PROFILE_META_KEY, JSON.stringify(meta));
}

// the file store of every profile except the first one has its own database
function profileFilesDatabase() {
	const id = profileMeta().current;

	return id === "default" ? "browos-files" : "browos-files-" + id;
}

function profileDb() {
	return new Promise(function (resolve, reject) {
		const request = indexedDB.open("browos-profiles", 1);

		request.onupgradeneeded = function () {
			request.result.createObjectStore("snapshots");
		};

		request.onsuccess = function () {
			resolve(request.result);
		};

		request.onerror = function () {
			reject(request.error);
		};
	});
}

function profileStore(mode, work) {
	return profileDb().then(function (db) {
		return new Promise(function (resolve, reject) {
			const tx = db.transaction("snapshots", mode);

			const request = work(tx.objectStore("snapshots"));

			tx.oncomplete = function () {
				resolve(request ? request.result : undefined);

				db.close();
			};

			tx.onerror = function () {
				reject(tx.error);
			};
		});
	});
}

function localSnapshot() {
	const data = {};

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);

		if (key !== PROFILE_META_KEY) {
			data[key] = localStorage.getItem(key);
		}
	}

	return data;
}

function replaceLocal(data) {
	const before = localSnapshot();

	try {
		Object.keys(before).forEach(function (key) {
			localStorage.removeItem(key);
		});

		Object.keys(data).forEach(function (key) {
			localStorage.setItem(key, data[key]);
		});
	} catch (error) {
		Object.keys(before).forEach(function (key) {
			try {
				localStorage.setItem(key, before[key]);
			} catch (restoreError) {
				// it fit before
			}
		});

		throw error;
	}
}

function switchProfile(id) {
	const meta = profileMeta();

	if (id === meta.current || !meta.list.some((p) => p.id === id)) {
		return Promise.resolve();
	}

	return profileStore("readwrite", function (store) {
		store.put(localSnapshot(), meta.current);
	})
		.then(function () {
			return profileStore("readonly", function (store) {
				return store.get(id);
			});
		})
		.then(function (target) {
			replaceLocal(target || {});

			meta.current = id;

			saveProfileMeta(meta);

			// a profile with a PIN asks for it right away
			sessionStorage.removeItem("browos-locked");

			if (localStorage.getItem("browos-pin")) {
				sessionStorage.setItem("browos-locked", "1");
			}

			location.reload();
		});
}

function createProfile(name) {
	const clean = String(name || "").trim().slice(0, 30);

	if (!clean) {
		return Promise.reject(new Error("Give the profile a name."));
	}

	const meta = profileMeta();

	if (meta.list.length >= 6) {
		return Promise.reject(new Error("That's the most profiles there can be (6)."));
	}

	if (meta.list.some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
		return Promise.reject(new Error("A profile with that name exists."));
	}

	const id = "p" + Date.now().toString(36);

	meta.list.push({ id: id, name: clean });

	saveProfileMeta(meta);

	return profileStore("readwrite", function (store) {
		store.put({}, id);
	}).then(function () {
		return id;
	});
}

function renameProfile(id, name) {
	const clean = String(name || "").trim().slice(0, 30);

	const meta = profileMeta();

	const profile = meta.list.find((p) => p.id === id);

	if (profile && clean) {
		profile.name = clean;

		saveProfileMeta(meta);
	}
}

function deleteProfile(id) {
	const meta = profileMeta();

	if (id === meta.current || id === "default") {
		return Promise.reject(new Error("The profile in use and the main profile can't be deleted."));
	}

	meta.list = meta.list.filter((p) => p.id !== id);

	saveProfileMeta(meta);

	return profileStore("readwrite", function (store) {
		store.delete(id);
	}).then(function () {
		// its files go too
		indexedDB.deleteDatabase("browos-files-" + id);
	});
}
