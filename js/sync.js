// Sync
// Keeps small things (settings, notes, tasks, habits, calendar...) the same in every browser
// where you are signed in, using the browser's own chrome.storage.sync (about 100 KB in total).
// Large items (an uploaded wallpaper) and device-specific ones (PIN, clipboard history) stay here.

const SYNC_ON_KEY = "browos-sync-on";
const SYNC_TS_KEY = "browos-sync-ts";
const SYNC_HASH_KEY = "browos-sync-hash";

const SYNC_CHUNK = 7000;
const SYNC_LIMIT = 90000;

const SYNC_SKIP = /^(browos-pin|browos-locked|browos-lock-startup|browos-clipboard|browos-sync-|browos-profiles-meta|browos-calendar-fired|browos-seen-builtins|browos-tour|customWallpaper)/;

let syncPushTimer = null;
let syncApplying = false;

function syncArea() {
	return typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync ? chrome.storage.sync : null;
}

function syncAvailable() {
	return Boolean(syncArea());
}

function syncEnabled() {
	return localStorage.getItem(SYNC_ON_KEY) === "on" && syncAvailable();
}

function syncableData() {
	const data = {};

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);

		const value = localStorage.getItem(key);

		if (!SYNC_SKIP.test(key) && value.length < 20000) {
			data[key] = value;
		}
	}

	return data;
}

function syncHash(text) {
	let h = 5381;

	for (let i = 0; i < text.length; i++) {
		h = ((h << 5) + h + text.charCodeAt(i)) | 0;
	}

	return String(h);
}

function syncStatus(text) {
	document.dispatchEvent(new CustomEvent("sync-status", { detail: text }));

	syncStatus.last = text;
}

function syncPush() {
	const area = syncArea();

	if (!area || !syncEnabled() || syncApplying) {
		return Promise.resolve(false);
	}

	const json = JSON.stringify(syncableData());

	const hash = syncHash(json);

	if (hash === localStorage.getItem(SYNC_HASH_KEY)) {
		return Promise.resolve(false);
	}

	if (json.length > SYNC_LIMIT) {
		syncStatus("Too much to sync (" + Math.round(json.length / 1024) + " KB of about 90 KB). Nothing was sent.");

		return Promise.resolve(false);
	}

	const parts = [];

	for (let i = 0; i < json.length; i += SYNC_CHUNK) {
		parts.push(json.slice(i, i + SYNC_CHUNK));
	}

	const ts = Date.now();

	const items = { "bos:meta": { ts: ts, n: parts.length, hash: hash } };

	parts.forEach(function (part, index) {
		items["bos:" + index] = part;
	});

	return new Promise(function (resolve) {
		area.get(null, function (existing) {
			const stale = Object.keys(existing || {}).filter(function (key) {
				return /^bos:\d+$/.test(key) && Number(key.slice(4)) >= parts.length;
			});

			area.set(items, function () {
				const error = chrome.runtime && chrome.runtime.lastError;

				if (error) {
					syncStatus("Couldn't sync: " + error.message);

					resolve(false);

					return;
				}

				if (stale.length) {
					area.remove(stale);
				}

				localStorage.setItem(SYNC_TS_KEY, String(ts));
				localStorage.setItem(SYNC_HASH_KEY, hash);

				syncStatus("Synced just now");

				resolve(true);
			});
		});
	});
}

// take what another browser has stored, if it is newer
function syncPull(announce) {
	const area = syncArea();

	if (!area || !syncEnabled()) {
		return Promise.resolve(false);
	}

	return new Promise(function (resolve) {
		area.get(null, function (all) {
			const meta = all && all["bos:meta"];

			if (!meta || meta.ts <= (Number(localStorage.getItem(SYNC_TS_KEY)) || 0) || meta.hash === localStorage.getItem(SYNC_HASH_KEY)) {
				resolve(false);

				return;
			}

			let json = "";

			for (let i = 0; i < meta.n; i++) {
				if (typeof all["bos:" + i] !== "string") {
					resolve(false);

					return;
				}

				json += all["bos:" + i];
			}

			let data;

			try {
				data = JSON.parse(json);
			} catch (error) {
				resolve(false);

				return;
			}

			if (!data || typeof data !== "object" || syncHash(json) !== meta.hash) {
				resolve(false);

				return;
			}

			syncApplying = true;

			try {
				const keep = {};

				// what is not synced stays as it is
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);

					if (SYNC_SKIP.test(key) || localStorage.getItem(key).length >= 20000) {
						keep[key] = localStorage.getItem(key);
					}
				}

				const before = {};

				for (let i = 0; i < localStorage.length; i++) {
					before[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
				}

				try {
					localStorage.clear();

					Object.keys(keep).forEach((key) => localStorage.setItem(key, keep[key]));

					Object.keys(data).forEach(function (key) {
						if (typeof data[key] === "string" && !SYNC_SKIP.test(key)) {
							localStorage.setItem(key, data[key]);
						}
					});

					localStorage.setItem(SYNC_ON_KEY, "on");
					localStorage.setItem(SYNC_TS_KEY, String(meta.ts));
					localStorage.setItem(SYNC_HASH_KEY, meta.hash);
				} catch (error) {
					localStorage.clear();

					Object.keys(before).forEach((key) => localStorage.setItem(key, before[key]));

					syncStatus("The synced data doesn't fit in this browser's storage.");

					syncApplying = false;

					resolve(false);

					return;
				}
			} finally {
				syncApplying = false;
			}

			resolve(true);

			if (announce !== false) {
				// the desktop starts again from the new data
				location.reload();
			}
		});
	});
}

function syncEnable() {
	if (!syncAvailable()) {
		return Promise.resolve(false);
	}

	localStorage.setItem(SYNC_ON_KEY, "on");

	// another browser may already have data: take it first, otherwise send ours
	return syncPull().then(function (pulled) {
		return pulled ? true : syncPush();
	});
}

function syncDisable() {
	localStorage.setItem(SYNC_ON_KEY, "off");

	syncStatus("Sync is off");
}

function syncSchedule() {
	clearTimeout(syncPushTimer);

	syncPushTimer = setTimeout(syncPush, 4000);
}

if (syncAvailable()) {
	// changes made here (settings, notes...) are sent a moment after they stop
	setInterval(function () {
		if (syncEnabled()) {
			syncSchedule();
		}
	}, 30000);

	chrome.storage.onChanged.addListener(function (changes, area) {
		if (area === "sync" && changes["bos:meta"] && syncEnabled() && !syncApplying) {
			syncPull();
		}
	});

	if (syncEnabled()) {
		syncPull().then(function (pulled) {
			if (!pulled) {
				syncSchedule();
			}
		});
	}
}
