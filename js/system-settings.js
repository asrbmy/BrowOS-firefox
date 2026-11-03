// Settings > System: profiles, sync, wallpaper slideshow, app permissions, accessibility, tour

(function () {
	const page = document.getElementById("systemPage");

	function section(title, note) {
		const box = document.createElement("div");

		const h = document.createElement("h3");

		h.textContent = title;

		box.appendChild(h);

		if (note) {
			const p = document.createElement("p");

			p.className = "settings-note";
			p.textContent = note;

			box.appendChild(p);
		}

		page.appendChild(box);

		return box;
	}

	function row(parent, label, control) {
		const r = document.createElement("div");

		r.className = "setting-row";

		const span = document.createElement("span");

		span.textContent = label;

		r.append(span, control);

		parent.appendChild(r);

		return r;
	}

	function button(text, handler, primary) {
		const b = document.createElement("button");

		b.className = "app-button" + (primary ? " primary" : "");
		b.textContent = text;

		b.addEventListener("click", handler);

		return b;
	}

	function message(parent) {
		const m = document.createElement("div");

		m.className = "data-message";
		m.setAttribute("role", "status");

		parent.appendChild(m);

		return function (text, good) {
			m.textContent = text;
			m.className = "data-message" + (good ? " good" : "");
		};
	}

	// Profiles

	const profiles = section("Profiles", "Each profile keeps its own settings, notes, tasks, app data and files. Switching reloads BrowOS.");

	const profileList = document.createElement("div");

	profiles.appendChild(profileList);

	const profileMessage = message(profiles);

	function drawProfiles() {
		const meta = profileMeta();

		profileList.innerHTML = "";

		meta.list.forEach(function (profile) {
			const current = profile.id === meta.current;

			const actions = document.createElement("span");

			actions.className = "button-row inline";

			if (current) {
				const badge = document.createElement("span");

				badge.textContent = "In use";
				badge.className = "muted";

				actions.appendChild(badge);
			} else {
				actions.appendChild(
					button("Switch", function () {
						switchProfile(profile.id).catch(function (error) {
							profileMessage("Couldn't switch: " + error.message);
						});
					}, true)
				);
			}

			actions.appendChild(
				button("Rename", function () {
					const name = prompt("New name", profile.name);

					if (name && name.trim()) {
						renameProfile(profile.id, name);

						drawProfiles();
					}
				})
			);

			if (!current && profile.id !== "default") {
				actions.appendChild(
					button("Delete", function () {
						if (confirm("Delete the profile " + profile.name + " with all its data and files?")) {
							deleteProfile(profile.id).then(drawProfiles, function (error) {
								profileMessage(error.message);
							});
						}
					})
				);
			}

			row(profileList, profile.name, actions);
		});
	}

	profiles.appendChild(
		button("New profile", function () {
			const name = prompt("Name of the new profile");

			if (name) {
				createProfile(name).then(
					function () {
						profileMessage("Profile added. Switch to it when you like.", true);

						drawProfiles();
					},
					function (error) {
						profileMessage(error.message);
					}
				);
			}
		})
	);

	drawProfiles();

	// Sync

	const sync = section("Sync", "Keeps settings, notes, tasks and other small data the same in every browser you're signed in to. Large items like an uploaded wallpaper, your PIN and clipboard history stay on this device. Files are not synced.");

	const syncToggle = document.createElement("input");

	syncToggle.type = "checkbox";

	row(sync, "Sync with my browser account", syncToggle);

	const syncText = document.createElement("div");

	syncText.className = "settings-note";

	sync.appendChild(syncText);

	function drawSync() {
		syncToggle.checked = syncEnabled();

		syncToggle.disabled = !syncAvailable();

		syncText.textContent = !syncAvailable()
			? "Sync is only available when BrowOS runs as a browser extension."
			: syncStatus.last || (syncEnabled() ? "Sync is on" : "Sync is off");
	}

	syncToggle.addEventListener("change", function () {
		if (syncToggle.checked) {
			syncEnable().then(drawSync);
		} else {
			syncDisable();

			drawSync();
		}
	});

	document.addEventListener("sync-status", drawSync);

	drawSync();

	// Wallpaper slideshow

	const slide = section("Wallpaper slideshow");

	const slideSelect = document.createElement("select");

	[["0", "Off"], ["1", "Every minute"], ["5", "Every 5 minutes"], ["15", "Every 15 minutes"], ["30", "Every 30 minutes"], ["60", "Every hour"], ["180", "Every 3 hours"]].forEach(function (option) {
		const o = document.createElement("option");

		o.value = option[0];
		o.textContent = option[1];

		slideSelect.appendChild(o);
	});

	slideSelect.value = String(slideshowMinutes());

	slideSelect.addEventListener("change", function () {
		localStorage.setItem(SLIDESHOW_KEY, slideSelect.value);

		localStorage.setItem(SLIDESHOW_LAST_KEY, String(Date.now()));
	});

	row(slide, "Change the wallpaper", slideSelect);

	// App permissions

	const perms = section("App permissions", "Websites you added from BrowStore can ask to use BrowOS features through the BrowOS SDK. What you allowed or refused is listed here.");

	const permList = document.createElement("div");

	perms.appendChild(permList);

	function drawPermissions() {
		const grants = sdkGrants();

		permList.innerHTML = "";

		const entries = [];

		Object.keys(grants).forEach(function (appId) {
			Object.keys(grants[appId]).forEach(function (feature) {
				entries.push([appId, feature, grants[appId][feature]]);
			});
		});

		if (entries.length === 0) {
			const none = document.createElement("div");

			none.className = "settings-note";
			none.textContent = "No app has asked for anything yet.";

			permList.appendChild(none);

			return;
		}

		entries.forEach(function (entry) {
			const app = getApp(entry[0]);

			const action = button("Forget", function () {
				const next = sdkGrants();

				delete next[entry[0]][entry[1]];

				if (!Object.keys(next[entry[0]]).length) {
					delete next[entry[0]];
				}

				sdkSaveGrants(next);
			});

			row(permList, (app ? app.name : entry[0]) + ": " + (SDK_FEATURES[entry[1]] || entry[1]) + " (" + (entry[2] ? "allowed" : "refused") + ")", action);
		});
	}

	document.addEventListener("sdk-grants-changed", drawPermissions);

	drawPermissions();

	// Accessibility

	const access = section("Accessibility");

	const motion = document.createElement("select");

	[["auto", "Follow the system"], ["on", "On"], ["off", "Off"]].forEach(function (option) {
		const o = document.createElement("option");

		o.value = option[0];
		o.textContent = option[1];

		motion.appendChild(o);
	});

	motion.value = localStorage.getItem(REDUCE_MOTION_KEY) || "auto";

	motion.addEventListener("change", function () {
		if (motion.value === "auto") {
			localStorage.removeItem(REDUCE_MOTION_KEY);
		} else {
			localStorage.setItem(REDUCE_MOTION_KEY, motion.value);
		}

		applyReduceMotion();
	});

	row(access, "Reduce motion", motion);

	const note = document.createElement("div");

	note.className = "settings-note";
	note.textContent = "For strong colors and borders, pick the High contrast theme pack in Personalization. F6 moves between the taskbar and the window in front.";

	access.appendChild(note);

	// Tour

	const tour = section("Tour");

	tour.appendChild(
		button("Show the tour again", function () {
			startTour();
		})
	);

	settingsTargets.push({ name: "System", page: "systemPage", words: "profiles sync wallpaper slideshow permissions accessibility reduce motion tour" });
})();
