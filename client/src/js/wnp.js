// =======================================================
// WiiM Now Playing

// Namespacing
window.WNP = window.WNP || {};

// Default settings
WNP.s = {
    // Host runs on default port 80, but in cases where another port is chosen adapt
    locHostname: location.hostname,
    locPort: (location.port && location.port != "80" && location.port != "1234") ? location.port : "80",
    rndAlbumArtUri: "./img/fake-album-1.jpg",
    // Device selection
    aDeviceUI: ["btnPrev", "btnPlay", "btnNext", "btnRefresh", "selDeviceChoices", "devName", "devNameHolder", "mediaTitle", "mediaSubTitle", "mediaArtist", "mediaAlbum", "mediaBitRate", "mediaBitDepth", "mediaSampleRate", "mediaQualityIdent", "devVol", "btnRepeat", "btnShuffle", "progressPlayed", "progressLeft", "progressPercent", "mediaSource", "albumArt", "bgAlbumArtBlur", "btnDevSelect", "oDeviceList", "btnDevPreset", "oPresetList", "btnDevVolume", "rVolume", "lyricsContainer", "lyricsPrev", "lyricsCurrent", "lyricsNext"],
    // Server actions to be used in the app
    aServerUI: ["btnReboot", "btnUpdate", "btnShutdown", "btnReloadUI", "sServerUrlHostname", "sServerUrlIP", "sServerVersion", "sClientVersion", "chkLyricsEnabled", "lyricsOffsetMs"],
};

// Data placeholders.
WNP.d = {
    serverSettings: null, // Server settings, used to store the server settings
    deviceList: null, // Device list, used to store the devices found through SSDP
    prevTransportState: null, // Previous transport state, used to detect changes in the transport state
    prevPlayMedium: null, // Previous play medium, used to detect changes in the play medium
    prevSourceIdent: null, // Previous source ident, used to detect changes in the source
    prevTrackInfo: null, // Previous track info, used to detect changes in the metadata
    lastState: null, // Last known state, used for lyrics timing
    lyrics: null, // Current lyrics payload
    lyricsIndex: null, // Current lyrics line index
    lyricsLines: [], // Parsed lyrics lines
    lyricsCookieApplied: false // Track if cookie setting has been applied
};

// Reference placeholders.
// These are set in the init function
// and are used to reference the UI elements in the app.
WNP.r = {};

/**
 * Initialisation of app.
 * @returns {undefined}
 */
WNP.Init = function () {
    console.log("WNP", "Initialising...");

    // Init Socket.IO, connect to port where server resides
    console.log("WNP", "Listening on " + this.s.locHostname + ":" + this.s.locPort)
    window.socket = io.connect(":" + this.s.locPort);

    // Set references to the UI elements
    this.setUIReferences();

    // Set Socket.IO definitions
    this.setSocketDefinitions();

    // Set UI event listeners
    this.setUIListeners();

    // Initial calls, wait a bit for socket to start
    setTimeout(() => {
        // Get server settings
        socket.emit("server-settings");
        // Get devices
        socket.emit("devices-get");
    }, 500);

    // Create random album intervals, every 3 minutes
    WNP.s.rndAlbumArtUri = WNP.rndAlbumArt("fake-album-");
    var rndAlbumInterval = setInterval(function () {
        WNP.s.rndAlbumArtUri = WNP.rndAlbumArt("fake-album-");
    }, 3 * 60 * 1000);

};

/**
 * Reference to the UI elements of the app.
 * @returns {undefined}
 */
WNP.setUIReferences = function () {
    console.log("WNP", "Set UI references...")

    function addElementToRef(id) {
        const element = document.getElementById(id);
        if (element) {
            WNP.r[id] = element;
        } else {
            console.log("WNP", `Element with ID '${id}' not found in current HTML.`);
        }
    }

    // Set references to the UI elements
    this.s.aDeviceUI.forEach((id) => { addElementToRef(id); });
    this.s.aServerUI.forEach((id) => { addElementToRef(id); });

};

/**
 * Setting the listeners on the UI elements of the app.
 * @returns {undefined}
 */
WNP.setUIListeners = function () {
    console.log("WNP", "Set UI Listeners...")

    // ------------------------------------------------
    // Player buttons

    // Previous button
    this.r.btnPrev.addEventListener("click", function () {
        var wnpAction = this.getAttribute("wnp-action");
        if (wnpAction) {
            this.disabled = true;
            socket.emit("device-action", wnpAction);
        }
    });

    // Play/Pause/Stop button
    this.r.btnPlay.addEventListener("click", function () {
        var wnpAction = this.getAttribute("wnp-action");
        if (wnpAction) {
            this.disabled = true;
            socket.emit("device-action", wnpAction);
        }
    });

    // Next button
    this.r.btnNext.addEventListener("click", function () {
        var wnpAction = this.getAttribute("wnp-action");
        if (wnpAction) {
            this.disabled = true;
            socket.emit("device-action", wnpAction);
        }
    });

    // ------------------------------------------------
    // Device control inputs (only for default GUI, not TV mode)

    // Device select button
    if (this.r.btnDevPreset) {
        this.r.btnDevPreset.addEventListener("click", function () {
            socket.emit("device-api", "getPresetInfo");
        });
    }

    // Device volume range input
    if (this.r.rVolume) {
        this.r.rVolume.addEventListener('input', function () {
            if (!isNaN(this.value) && this.value >= 0 && this.value <= 100) {
                socket.emit("device-api", "setPlayerCmd:vol:" + this.value);
            }
        });
    }

    // ------------------------------------------------
    // Settings buttons

    // Device selection dropdown
    this.r.selDeviceChoices.addEventListener("change", function () {
        socket.emit("device-set", this.value);
    });

    // Refresh devices button
    this.r.btnRefresh.addEventListener("click", function () {
        socket.emit("devices-refresh");
        // Wait for discovery to finish
        setTimeout(() => {
            socket.emit("devices-get");
            socket.emit("server-settings");
        }, 5000);
    });

    // Reboot button
    this.r.btnReboot.addEventListener("click", function () {
        socket.emit("server-reboot");
    });

    // Update button
    this.r.btnUpdate.addEventListener("click", function () {
        socket.emit("server-update");
    });

    // Shutdown button
    this.r.btnShutdown.addEventListener("click", function () {
        socket.emit("server-shutdown");
    });

    // Reload UI button
    this.r.btnReloadUI.addEventListener("click", function () {
        location.reload();
    });

    // Lyrics toggle
    if (this.r.chkLyricsEnabled) {
        this.r.chkLyricsEnabled.addEventListener("change", function () {
            WNP.setCookie("wnpLyricsEnabled", this.checked, 180);
            socket.emit("server-settings-update", {
                features: {
                    lyrics: {
                        enabled: this.checked
                    }
                }
            });
        });
    }

    if (this.r.lyricsOffsetMs) {
        this.r.lyricsOffsetMs.addEventListener("change", function () {
            var offsetValue = parseInt(this.value, 10);
            if (isNaN(offsetValue)) {
                offsetValue = 0;
            }
            socket.emit("server-settings-update", {
                features: {
                    lyrics: {
                        offsetMs: offsetValue
                    }
                }
            });
        });
    }

};

/**
 * Set the socket definitions to listen for specific websocket traffic and handle accordingly.
 * @returns {undefined}
 */
WNP.setSocketDefinitions = function () {
    console.log("WNP", "Setting Socket definitions...")

    // On server settings
    socket.on("server-settings", function (msg) {

        // Store server settings
        WNP.d.serverSettings = msg;

        // RPi has bash, so possibly able to reboot/shutdown.
        if (msg && msg.os && msg.os.userInfo && msg.os.userInfo.shell === "/bin/bash") {
            WNP.r.btnReboot.disabled = false;
            WNP.r.btnUpdate.disabled = false;
            WNP.r.btnShutdown.disabled = false;
        };

        // Set device name
        WNP.r.devName.innerText = (msg && msg.selectedDevice && msg.selectedDevice.friendlyName) ? msg.selectedDevice.friendlyName : "-";

        // Set the server local url
        if (msg && msg.os && msg.os.hostname) {
            var sUrl = "http://" + msg.os.hostname.toLowerCase() + ".local";
            sUrl += (location && location.port && location.port != 80) ? ":" + location.port + "/" : "/";
            WNP.r.sServerUrlHostname.innerHTML = "<a href=\"" + sUrl + "\">" + sUrl + "</a>";
        }
        else {
            WNP.r.sServerUrlHostname.innerText = "-";
        }
        // Set the server ip address
        if (msg && msg.selectedDevice && msg.selectedDevice.location && msg.os && msg.os.networkInterfaces) {
            // Grab the ip address pattern of the selected device
            // Assumption is that the wiim-now-playing server is on the same ip range as the client..
            var sLocationIp = msg.selectedDevice.location.split("/")[2]; // Extract ip address from location
            var aIpAddress = sLocationIp.split("."); // Split ip address in parts
            aIpAddress.pop(); // Remove the last part
            var sIpPattern = aIpAddress.join("."); // Construct ip address pattern
            // Search for server ip address(es) in this range...
            Object.keys(msg.os.networkInterfaces).forEach(function (key, index) {
                var sIpFound = msg.os.networkInterfaces[key].find(addr => addr.address.startsWith(sIpPattern))
                if (sIpFound) {
                    // Construct ip address and optional port
                    var sUrl = "http://" + sIpFound.address;
                    sUrl += (location && location.port && location.port != 80) ? ":" + location.port + "/" : "/";
                    WNP.r.sServerUrlIP.innerHTML = "<a href=\"" + sUrl + "\">" + sUrl + "</a>";
                }
            });
        }
        else {
            WNP.r.sServerUrlIP.innerText = "-";
        }

        // Set the server version
        WNP.r.sServerVersion.innerText = (msg && msg.version && msg.version.server) ? msg.version.server : "-";
        // Set the client version
        WNP.r.sClientVersion.innerText = (msg && msg.version && msg.version.client) ? msg.version.client : "-";

        if (WNP.r.chkLyricsEnabled) {
            WNP.r.chkLyricsEnabled.checked = Boolean(msg && msg.features && msg.features.lyrics && msg.features.lyrics.enabled);
        }
        if (WNP.r.lyricsOffsetMs) {
            var offsetMs = (msg && msg.features && msg.features.lyrics && typeof msg.features.lyrics.offsetMs === "number") ? msg.features.lyrics.offsetMs : 0;
            WNP.r.lyricsOffsetMs.value = offsetMs;
        }

        if (WNP.r.chkLyricsEnabled && !WNP.d.lyricsCookieApplied) {
            var cookieValue = WNP.getCookie("wnpLyricsEnabled");
            if (cookieValue !== null) {
                var cookieEnabled = cookieValue === "true";
                if (WNP.r.chkLyricsEnabled.checked !== cookieEnabled) {
                    WNP.r.chkLyricsEnabled.checked = cookieEnabled;
                    socket.emit("server-settings-update", {
                        features: {
                            lyrics: {
                                enabled: cookieEnabled
                            }
                        }
                    });
                }
            } else {
                WNP.setCookie("wnpLyricsEnabled", WNP.r.chkLyricsEnabled.checked, 180);
            }
            WNP.d.lyricsCookieApplied = true;
        }

    });

    // On devices get
    socket.on("devices-get", function (msg) {

        // Store and sort device list
        WNP.d.deviceList = msg;
        WNP.d.deviceList.sort((a, b) => { return (a.friendlyName < b.friendlyName) ? -1 : 1 });

        // Clear choices
        WNP.r.selDeviceChoices.innerHTML = "<option value=\"\">Select a device...</em></li>"; // Settings modal
        if (WNP.r.oDeviceList) WNP.r.oDeviceList.innerHTML = ""; // Device dropup

        // Add WiiM devices
        var devicesWiiM = WNP.d.deviceList.filter((d) => { return d.manufacturer.startsWith("Linkplay") });
        if (devicesWiiM.length > 0) {

            // Device select options
            var optGroup = document.createElement("optgroup");
            optGroup.label = "WiiM devices";
            devicesWiiM.forEach((device) => {
                var opt = document.createElement("option");
                opt.value = device.location;
                opt.innerText = device.friendlyName;
                opt.title = "By " + device.manufacturer;
                if (WNP.d.serverSettings && WNP.d.serverSettings.selectedDevice && WNP.d.serverSettings.selectedDevice.location === device.location) {
                    opt.setAttribute("selected", "selected");
                };
                optGroup.appendChild(opt);
            })
            WNP.r.selDeviceChoices.appendChild(optGroup);

            // Device dropup
            if (WNP.r.oDeviceList) {
                devicesWiiM.forEach((device) => {
                    var ddItem = document.createElement("li");
                    var ddItemA = document.createElement("a");
                    ddItemA.className = "dropdown-item";
                    ddItemA.href = "javascript:WNP.setDeviceByLocation('" + device.location + "');";
                    ddItemA.innerText = device.friendlyName;
                    if (WNP.d.serverSettings && WNP.d.serverSettings.selectedDevice && WNP.d.serverSettings.selectedDevice.location === device.location) {
                        ddItemA.classList.add("active");
                        ddItemA.setAttribute("aria-current", "true");
                    }
                    ddItem.appendChild(ddItemA);
                    WNP.r.oDeviceList.appendChild(ddItem);
                })
            }

        };

        // Other devices
        // Possibly removing this section in future releases.
        var devicesOther = WNP.d.deviceList.filter((d) => { return !d.manufacturer.startsWith("Linkplay") });
        if (devicesOther.length > 0) {

            // Device select dropdown options
            var optGroup = document.createElement("optgroup");
            optGroup.label = "Other devices";
            devicesOther.forEach((device) => {
                var opt = document.createElement("option");
                opt.value = device.location;
                opt.innerText = device.friendlyName;
                opt.title = "By " + device.manufacturer;
                if (WNP.d.serverSettings && WNP.d.serverSettings.selectedDevice && WNP.d.serverSettings.selectedDevice.location === device.location) {
                    opt.setAttribute("selected", "selected");
                };
                optGroup.appendChild(opt);
            })
            WNP.r.selDeviceChoices.appendChild(optGroup);

            // Device dropup
            // We won't show non-WiiM devices in the dropup for now.

        };

        // No devices found
        if (devicesWiiM.length == 0 && devicesOther.length == 0) {
            WNP.r.selDeviceChoices.innerHTML = "<option disabled=\"disabled\">No devices found!</em></li>";
            if (WNP.r.oDeviceList) WNP.r.oDeviceList.innerHTML = "<li><span class=\"dropdown-header\">No devices found!</span></li>";
        };

    });

    // On state
    socket.on("state", function (msg) {
        if (!msg) { return false; }

        // Get player progress data from the state message.
        var timeStampDiff = 0;
        if (msg.CurrentTransportState === "PLAYING") {
            timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
        }
        var relTime = (msg.RelTime) ? msg.RelTime : "00:00:00";
        var trackDuration = (msg.TrackDuration) ? msg.TrackDuration : "00:00:00";

        // Get current player progress and set UI elements accordingly.
        var oPlayerProgress = WNP.getPlayerProgress(relTime, trackDuration, timeStampDiff, msg.CurrentTransportState);
        WNP.r.progressPlayed.children[0].innerText = oPlayerProgress.played;
        WNP.r.progressLeft.children[0].innerText = (oPlayerProgress.left != "") ? "-" + oPlayerProgress.left : "";
        WNP.r.progressPercent.setAttribute("aria-valuenow", oPlayerProgress.percent)
        WNP.r.progressPercent.children[0].setAttribute("style", "width:" + oPlayerProgress.percent + "%");

        WNP.d.lastState = msg;
        WNP.updateLyricsProgress(relTime, timeStampDiff);

        // Device transport state or play medium changed...?
        if (WNP.d.prevTransportState !== msg.CurrentTransportState || WNP.d.prevPlayMedium !== msg.PlayMedium) {
            if (msg.CurrentTransportState === "TRANSITIONING") {
                WNP.r.btnPlay.children[0].className = "bi bi-circle-fill";
                WNP.r.btnPlay.disabled = true;
            };
            if (msg.CurrentTransportState === "PLAYING") {
                // Radio live streams are preferrentialy stopped as pausing keeps cache for minutes/hours(?).
                // Stop > Play resets the stream to 'now'. Pause works like 'live tv time shift'.
                if (msg.PlayMedium && msg.PlayMedium === "RADIO-NETWORK") {
                    WNP.r.btnPlay.children[0].className = "bi bi-stop-circle-fill";
                    WNP.r.btnPlay.setAttribute("wnp-action", "Stop");
                }
                else {
                    WNP.r.btnPlay.children[0].className = "bi bi-pause-circle-fill";
                    WNP.r.btnPlay.setAttribute("wnp-action", "Pause");
                }
                WNP.r.btnPlay.disabled = false;
            }
            else if (msg.CurrentTransportState === "PAUSED_PLAYBACK" || msg.CurrentTransportState === "STOPPED") {
                WNP.r.btnPlay.children[0].className = "bi bi-play-circle-fill";
                WNP.r.btnPlay.setAttribute("wnp-action", "Play");
                WNP.r.btnPlay.disabled = false;
            };
            WNP.d.prevTransportState = msg.CurrentTransportState; // Remember the last transport state
            WNP.d.prevPlayMedium = msg.PlayMedium; // Remember the last PlayMedium
        }

        // If internet radio, there is no skipping... just start and stop!
        if (msg.PlayMedium && msg.PlayMedium === "RADIO-NETWORK") {
            WNP.r.btnPrev.disabled = true;
            WNP.r.btnNext.disabled = true;
        }
        else {
            WNP.r.btnPrev.disabled = false;
            WNP.r.btnNext.disabled = false;
        }

    });

    // On metadata
    socket.on("metadata", function (msg) {
        if (!msg) { return false; }

        // Source detection
        var playMedium = (msg.PlayMedium) ? msg.PlayMedium : "";
        var trackSource = (msg.TrackSource) ? msg.TrackSource : "";
        var sourceIdent = WNP.getSourceIdent(playMedium, trackSource);
        // Did the source ident change...?
        if (sourceIdent !== WNP.d.prevSourceIdent) {
            if (sourceIdent !== "") {
                var identImg = document.createElement("img");
                identImg.src = sourceIdent;
                identImg.alt = playMedium + ": " + trackSource;
                identImg.title = playMedium + ": " + trackSource;
                mediaSource.innerHTML = identImg.outerHTML;
            }
            else {
                mediaSource.innerText = playMedium + ": " + trackSource;
            }
            WNP.d.prevSourceIdent = sourceIdent; // Remember the last Source Ident
        }

        // Song Title, Subtitle, Artist, Album
        WNP.r.mediaTitle.innerText = (msg.trackMetaData && msg.trackMetaData["dc:title"]) ? msg.trackMetaData["dc:title"] : "";
        WNP.r.mediaSubTitle.innerText = (msg.trackMetaData && msg.trackMetaData["dc:subtitle"]) ? msg.trackMetaData["dc:subtitle"] : "";
        WNP.r.mediaArtist.innerText = (msg.trackMetaData && msg.trackMetaData["upnp:artist"]) ? msg.trackMetaData["upnp:artist"] : "";
        WNP.r.mediaAlbum.innerText = (msg.trackMetaData && msg.trackMetaData["upnp:album"]) ? msg.trackMetaData["upnp:album"] : "";
        if (playMedium === "SONGLIST-NETWORK" && !trackSource && msg.CurrentTransportState === "STOPPED") {
            WNP.r.mediaTitle.innerText = "No Music Selected";
        }

        // Audio quality
        var songBitrate = (msg.trackMetaData && msg.trackMetaData["song:bitrate"]) ? msg.trackMetaData["song:bitrate"] : "";
        var songBitDepth = (msg.trackMetaData && msg.trackMetaData["song:format_s"]) ? msg.trackMetaData["song:format_s"] : "";
        var songSampleRate = (msg.trackMetaData && msg.trackMetaData["song:rate_hz"]) ? msg.trackMetaData["song:rate_hz"] : "";
        WNP.r.mediaBitRate.innerText = (songBitrate > 0) ? ((songBitrate > 1000) ? (songBitrate / 1000).toFixed(2) + " mbps, " : songBitrate + " kbps, ") : "";
        WNP.r.mediaBitDepth.innerText = (songBitDepth > 0) ? ((songBitDepth > 24) ? "24 bit/" : songBitDepth + " bit/") : "";
        WNP.r.mediaSampleRate.innerText = (songSampleRate > 0) ? (songSampleRate / 1000).toFixed(1) + " kHz" : "";
        if (!songBitrate && !songBitDepth && !songSampleRate) {
            WNP.r.mediaQualityIdent.style.display = "none";
        }
        else {
            WNP.r.mediaQualityIdent.style.display = "inline-block";
        }

        // Audio quality ident badge (HD/Hi-res/CD/...)
        var songQuality = (msg.trackMetaData && msg.trackMetaData["song:quality"]) ? msg.trackMetaData["song:quality"] : "";
        var songActualQuality = (msg.trackMetaData && msg.trackMetaData["song:actualQuality"]) ? msg.trackMetaData["song:actualQuality"] : "";
        var qualiIdent = WNP.getQualityIdent(songQuality, songActualQuality, songBitrate, songBitDepth, songSampleRate);
        if (qualiIdent !== "") {
            WNP.r.mediaQualityIdent.innerText = qualiIdent;
            WNP.r.mediaQualityIdent.title = "Quality: " + songQuality + ", " + songActualQuality;
        }
        else {
            var identId = document.createElement("i");
            identId.className = "bi bi-soundwave text-secondary";
            identId.title = "Quality: " + songQuality + ", " + songActualQuality;
            WNP.r.mediaQualityIdent.innerHTML = identId.outerHTML;
        }

        // Pre-process Album Art uri, if any is available from the metadata.
        var albumArtUriRaw = (msg.trackMetaData && msg.trackMetaData["upnp:albumArtURI"]) ? msg.trackMetaData["upnp:albumArtURI"] : "";
        var albumArtUri = WNP.checkAlbumArtURI(albumArtUriRaw, msg.metadataTimeStamp);

        // Set Album Art, only if the track changed and the URI changed
        var trackChanged = false;
        var currentTrackInfo = WNP.r.mediaTitle.innerText + "|" + WNP.r.mediaSubTitle.innerText + "|" + WNP.r.mediaArtist.innerText + "|" + WNP.r.mediaAlbum.innerText;
        var currentAlbumArt = WNP.r.albumArt.src;
        if (WNP.d.prevTrackInfo !== currentTrackInfo) {
            trackChanged = true;
            WNP.d.prevTrackInfo = currentTrackInfo; // Remember the last track info
            console.log("WNP", "Track changed:", currentTrackInfo);
            WNP.clearLyrics();
        }
        if (trackChanged && currentAlbumArt != albumArtUri) {
            WNP.setAlbumArt(albumArtUri);
        }

        // Device volume
        WNP.r.devVol.innerText = (msg.CurrentVolume) ? msg.CurrentVolume : "-"; // Set the volume on the UI
        if (WNP.r.rVolume && (WNP.r.rVolume.value !== WNP.r.devVol.innerText)) { // If volume on the range slider is different then update the range input value
            WNP.r.rVolume.value = WNP.r.devVol.innerText;
        }

        // Loop mode status
        if (msg.LoopMode) {
            switch (msg.LoopMode) {
                case "5": // repeat-1 | shuffle
                    WNP.r.btnRepeat.className = "btn btn-outline-success";
                    WNP.r.btnRepeat.children[0].className = "bi bi-repeat-1";
                    WNP.r.btnShuffle.className = "btn btn-outline-success";
                    break;
                case "3": // no repeat | shuffle
                    WNP.r.btnRepeat.className = "btn btn-outline-light";
                    WNP.r.btnRepeat.children[0].className = "bi bi-repeat";
                    WNP.r.btnShuffle.className = "btn btn-outline-success";
                    break;
                case "2": // repeat | shuffle
                    WNP.r.btnRepeat.className = "btn btn-outline-success";
                    WNP.r.btnRepeat.children[0].className = "bi bi-repeat";
                    WNP.r.btnShuffle.className = "btn btn-outline-success";
                    break;
                case "1": // repeat-1 | no shuffle
                    WNP.r.btnRepeat.className = "btn btn-outline-success";
                    WNP.r.btnRepeat.children[0].className = "bi bi-repeat-1";
                    WNP.r.btnShuffle.className = "btn btn-outline-light";
                    // change repeat icon
                    break;
                case "0": // repeat | no shuffle
                    WNP.r.btnRepeat.className = "btn btn-outline-success";
                    WNP.r.btnRepeat.children[0].className = "bi bi-repeat";
                    WNP.r.btnShuffle.className = "btn btn-outline-light";
                    break;
                default: // no repeat | no shuffle #4
                    WNP.r.btnRepeat.className = "btn btn-outline-light";
                    WNP.r.btnRepeat.children[0].className = "bi bi-repeat";
                    WNP.r.btnShuffle.className = "btn btn-outline-light";
            }
        }
        else { // Unknown, so set default
            WNP.r.btnRepeat.className = "btn btn-outline-light";
            WNP.r.btnRepeat.children[0].className = "bi bi-repeat";
            WNP.r.btnShuffle.className = "btn btn-outline-light";
        }

    });

    // On lyrics
    socket.on("lyrics", function (msg) {
        WNP.d.lyrics = msg;
        WNP.d.lyricsIndex = null;

        if (!msg || msg.status !== "ok" || !msg.syncedLyrics) {
            WNP.clearLyrics();
            return;
        }

        WNP.d.lyricsLines = WNP.parseSyncedLyrics(msg.syncedLyrics);
        if (!WNP.d.lyricsLines.length) {
            WNP.clearLyrics();
            return;
        }

        WNP.r.lyricsContainer.classList.add("is-visible");
        WNP.updateLyricsProgress(null, 0);
    });

    // On device set
    socket.on("device-set", function (msg) {
        // Device switch? Fetch settings and device info again.
        socket.emit("server-settings");
        socket.emit("devices-get");
    });

    // On device refresh
    socket.on("devices-refresh", function (msg) {
        WNP.r.selDeviceChoices.innerHTML = "<option disabled=\"disabled\">Waiting for devices...</em></li>";
        if (WNP.r.oDeviceList) WNP.r.oDeviceList.innerHTML = "<li><span class=\"dropdown-header\">Waiting for devices...</span></li>";
    });

    // On device action (i.e. for play, pause, next, previous)
    socket.on("device-action", function (msg, param) {
        // Actions do not return a message.
        // so we don't need to do anything here.
        // Maybe later we can use this to show a notification or similar.
        console.log("WNP", "Action:", msg);
    });

    // On device API response
    socket.on("device-api", function (msg, param) {
        // console.log("IO: device-api", msg, param);
        switch (msg) {
            case "getPresetInfo":
                // Preset info response
                if (!param || param.preset_num < 1) {
                    // No presets
                    WNP.r.oPresetList.innerHTML = "<li><span class=\"dropdown-header\">No presets found!</span></li>";
                    return false;
                }
                else {
                    // Presets found
                    WNP.r.oPresetList.innerHTML = ""; // Clear existing list
                    var sCurrentTitle = WNP.r.mediaTitle.innerText;
                    var sCurrentSubtitle = WNP.r.mediaSubTitle.innerText;
                    param.preset_list.forEach((preset) => {
                        var ddItem = document.createElement("li");
                        var ddItemA = document.createElement("a");
                        ddItemA.className = "dropdown-item";
                        ddItemA.href = "javascript:WNP.setPresetByNumber(" + preset.number + ");";
                        ddItemA.innerHTML = "<img src=\"" + WNP.checkAlbumArtURI(preset.picurl, Date.now()) + "\"/> " + preset.name;
                        if (sCurrentTitle === preset.name || sCurrentSubtitle === preset.name) {
                            ddItemA.classList.add("active");
                            ddItemA.setAttribute("aria-current", "true");
                        }
                        ddItem.appendChild(ddItemA);
                        WNP.r.oPresetList.appendChild(ddItem);
                    })
                }
                break;
            case msg.startsWith("MCUKeyShortClick:") ? msg : false:
                // Preset set response, no further action needed
                break;
            case "getPlayerStatus":
                // Player status response
                // Called when getting volume
                if (param && param.vol !== undefined) {
                    WNP.r.devVol.innerText = param.vol;
                }
                break;
            case msg.startsWith("setPlayerCmd:vol:") ? msg : false:
                // Volume set response
                socket.emit("device-api", "getPlayerStatus"); // Refresh volume UI
                break;
            default:
                // No action
                break;
        }
    });

    // On server reboot
    socket.on("server-reboot", function (msg) {
        // Possibly show a notification that reboot is in progress
        console.log("WNP", "Server reboot:", msg);
    });

    // On server update
    socket.on("server-update", function (msg) {
        // Possibly show a notification that update is in progress
        console.log("WNP", "Server update:", msg);
    });

    // On server shutdown
    socket.on("server-shutdown", function (msg) {
        // Possibly show a notification that shutdown is in progress
        console.log("WNP", "Server shutdown:", msg);
    });

};

// =======================================================
// Helper functions

/**
 * Set device according to the chosen one through the Device dropup.
 * @param {string} deviceLocation - The location of the device to set.
 * @return {undefined}
  */
WNP.setDeviceByLocation = function (deviceLocation) {
    if (deviceLocation) {
        socket.emit("device-set", deviceLocation);
    }
    return false;
};

/**
 * Set the preset on the device.
 * @param {integer} presetNumber - The number of the preset to set.
 * @return {undefined}
 */

WNP.setPresetByNumber = function (presetNumber) {
    if (presetNumber && !isNaN(presetNumber) && presetNumber > 0) {
        socket.emit("device-api", "MCUKeyShortClick:" + presetNumber);
    }
    return false;
};

/**
 * Get player progress helper.
 * @param {string} relTime - Time elapsed while playing, format 00:00:00
 * @param {string} trackDuration - Total play time, format 00:00:00
 * @param {integer} timeStampDiff - Possible play time offset in seconds
 * @param {string} currentTransportState - The current transport state "PLAYING" or otherwise
 * @returns {object} An object with corrected played, left, total and percentage played
 */
WNP.getPlayerProgress = function (relTime, trackDuration, timeStampDiff, currentTransportState) {
    var relTimeSec = this.convertToSeconds(relTime) + timeStampDiff;
    var trackDurationSec = this.convertToSeconds(trackDuration);
    if (trackDurationSec > 0 && relTimeSec < trackDurationSec) {
        var percentPlayed = ((relTimeSec / trackDurationSec) * 100).toFixed(1);
        return {
            played: WNP.convertToMinutes(relTimeSec),
            left: WNP.convertToMinutes(trackDurationSec - relTimeSec),
            total: WNP.convertToMinutes(trackDurationSec),
            percent: percentPlayed
        };
    }
    else if (trackDurationSec == 0 && currentTransportState == "PLAYING") {
        return {
            played: "Live",
            left: "",
            total: "",
            percent: 100
        };
    }
    else {
        return {
            played: "Paused",
            left: "",
            total: "",
            percent: 0
        };
    };
};

/**
 * Convert time format '00:00:00' to total number of seconds.
 * @param {string} sDuration - Time, format 00:00:00.
 * @returns {integer} The number of seconds that the string represents.
 */
WNP.convertToSeconds = function (sDuration) {
    const timeSections = sDuration.split(":");
    let totalSeconds = 0;
    for (let i = 0; i < timeSections.length; i++) {
        var nFactor = timeSections.length - 1 - i; // Count backwards
        var nMultiplier = Math.pow(60, nFactor); // 60^n
        totalSeconds += nMultiplier * parseInt(timeSections[i]); // Calculate the seconds
    }
    return totalSeconds
};

/**
 * Convert number of seconds to '00:00' string format. 
 * Sorry for those hour+ long songs...
 * @param {integer} seconds - Number of seconds total.
 * @returns {string} The string representation of seconds in minutes, format 00:00.
 */
WNP.convertToMinutes = function (seconds) {
    var tempDate = new Date(0);
    tempDate.setSeconds(seconds);
    var result = tempDate.toISOString().substring(14, 19);
    return result;
};

/**
 * Parse synced lyrics (LRC format) into timestamps.
 * @param {string} syncedLyrics - LRC formatted lyrics string.
 * @returns {array} Array of lyric lines with time in ms.
 */
WNP.parseSyncedLyrics = function (syncedLyrics) {
    if (!syncedLyrics) {
        return [];
    }
    const lines = syncedLyrics.split(/\r?\n/);
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

    lines.forEach((line) => {
        let match;
        const text = line.replace(timeRegex, "").trim();
        while ((match = timeRegex.exec(line)) !== null) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseInt(match[2], 10);
            const fraction = match[3] ? match[3].padEnd(3, "0") : "000";
            const millis = (minutes * 60 + seconds) * 1000 + parseInt(fraction, 10);
            parsed.push({
                timeMs: millis,
                text: text
            });
        }
    });

    return parsed
        .filter((entry) => entry.text !== "")
        .sort((a, b) => a.timeMs - b.timeMs);
};

/**
 * Clear lyrics UI.
 * @returns {undefined}
 */
WNP.clearLyrics = function () {
    if (WNP.r.lyricsContainer) {
        WNP.r.lyricsContainer.classList.remove("is-visible");
        WNP.r.lyricsContainer.classList.remove("is-pending");
    }
    if (WNP.r.lyricsPrev) {
        WNP.r.lyricsPrev.innerText = "";
    }
    if (WNP.r.lyricsCurrent) {
        WNP.r.lyricsCurrent.innerText = "";
    }
    if (WNP.r.lyricsNext) {
        WNP.r.lyricsNext.innerText = "";
    }
    WNP.d.lyricsLines = [];
    WNP.d.lyricsIndex = null;
};

/**
 * Toggle pending lyrics state.
 * @param {boolean} isPending - Whether lyrics are pending.
 * @returns {undefined}
 */
WNP.setLyricsPending = function (isPending) {
    if (!WNP.r.lyricsContainer) {
        return;
    }
    if (isPending) {
        WNP.r.lyricsContainer.classList.add("is-pending");
    } else {
        WNP.r.lyricsContainer.classList.remove("is-pending");
    }
};

/**
 * Update lyrics display based on player progress.
 * @param {string|null} relTime - Time elapsed while playing, format 00:00:00.
 * @param {integer} timeStampDiff - Possible play time offset in seconds.
 * @returns {undefined}
 */
WNP.updateLyricsProgress = function (relTime, timeStampDiff) {
    if (!WNP.d.lyricsLines || WNP.d.lyricsLines.length === 0) {
        return;
    }

    var currentRelTime = relTime || (WNP.d.lastState && WNP.d.lastState.RelTime) || "00:00:00";
    var currentOffset = timeStampDiff || 0;
    var currentSeconds = WNP.convertToSeconds(currentRelTime) + currentOffset;
    var currentMs = currentSeconds * 1000 + WNP.getLyricsOffsetMs();

    var currentIndex = -1;
    for (let i = 0; i < WNP.d.lyricsLines.length; i++) {
        if (WNP.d.lyricsLines[i].timeMs <= currentMs) {
            currentIndex = i;
        } else {
            break;
        }
    }

    if (currentIndex === -1) {
        WNP.setLyricsPending(true);
        WNP.setLyricsLines(
            WNP.d.lyricsLines[0] ? WNP.d.lyricsLines[0].text : "",
            WNP.d.lyricsLines[1] ? WNP.d.lyricsLines[1].text : "",
            WNP.d.lyricsLines[2] ? WNP.d.lyricsLines[2].text : ""
        );
        WNP.d.lyricsIndex = -1;
        return;
    }

    if (WNP.d.lyricsIndex === currentIndex) {
        return;
    }

    WNP.setLyricsPending(false);
    WNP.d.lyricsIndex = currentIndex;
    var prevLine = currentIndex > 0 ? WNP.d.lyricsLines[currentIndex - 1].text : "";
    var currentLine = WNP.d.lyricsLines[currentIndex].text;
    var nextLine = WNP.d.lyricsLines[currentIndex + 1] ? WNP.d.lyricsLines[currentIndex + 1].text : "";
    WNP.setLyricsLines(prevLine, currentLine, nextLine);
};

/**
 * Update lyrics line text.
 * @param {string} prevLine - Previous line.
 * @param {string} currentLine - Current line.
 * @param {string} nextLine - Next line.
 * @returns {undefined}
 */
WNP.setLyricsLines = function (prevLine, currentLine, nextLine) {
    if (!WNP.r.lyricsPrev || !WNP.r.lyricsCurrent || !WNP.r.lyricsNext) {
        return;
    }
    WNP.r.lyricsPrev.innerText = prevLine;
    WNP.r.lyricsCurrent.innerText = currentLine;
    WNP.r.lyricsNext.innerText = nextLine;
};

/**
 * Get lyrics offset (in ms) from server settings.
 * @returns {number}
 */
WNP.getLyricsOffsetMs = function () {
    if (WNP.d.serverSettings && WNP.d.serverSettings.features && WNP.d.serverSettings.features.lyrics && typeof WNP.d.serverSettings.features.lyrics.offsetMs === "number") {
        return WNP.d.serverSettings.features.lyrics.offsetMs;
    }
    return 0;
};

/**
 * Set a cookie with optional expiration in days.
 * @param {string} name - Cookie name.
 * @param {string|boolean|number} value - Cookie value.
 * @param {number} days - Days until expiration.
 * @returns {undefined}
 */
WNP.setCookie = function (name, value, days) {
    var expires = "";
    if (typeof days === "number") {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + encodeURIComponent(String(value)) + expires + "; path=/";
};

/**
 * Get a cookie by name.
 * @param {string} name - Cookie name.
 * @returns {string|null}
 */
WNP.getCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
};

/**
 * Check if the album art is a valid URI. Returns the URI if valid, otherwise a random URI.
 * Error handling is handled by the onerror event on the image itself.
 * @param {string} sAlbumArtUri - The URI of the album art.
 * @param {integer} nTimestamp - The time in milliseconds, used as cache buster.
 * @returns {string} The URI of the album art.
 */
WNP.checkAlbumArtURI = function (sAlbumArtUri, nTimestamp) {
    // If the URI starts with https, the self signed certificate may not trusted by the browser.
    // Hence we always try and load the image through a reverse proxy, ignoring the certificate.
    if (sAlbumArtUri && sAlbumArtUri.startsWith("https")) {
        var sAlbumArtProxyUri = "";
        if (WNP.s.locPort != "80") { // If the server is not running on port 80, we need to add the port to the URI
            sAlbumArtProxyUri = "http://" + WNP.s.locHostname + ":" + WNP.s.locPort + "/proxy-art?url=" + encodeURIComponent(sAlbumArtUri) + "&ts=" + nTimestamp; // Use the current timestamp as cache buster
        } else {
            sAlbumArtProxyUri = "http://" + WNP.s.locHostname + "/proxy-art?url=" + encodeURIComponent(sAlbumArtUri) + "&ts=" + nTimestamp; // Use the current timestamp as cache buster
        }
        return sAlbumArtProxyUri;
    } else if (sAlbumArtUri && sAlbumArtUri.startsWith("http")) {
        return sAlbumArtUri;
    } else {
        // Looks like an invalid/un_known album art, use the fallback.
        return WNP.s.rndAlbumArtUri;
    }
};

/**
 * Sets the album art. Both on the foreground and background.
 * @param {integer} imgUri - The URI of the album art.
 * @returns {undefined}
 */
WNP.setAlbumArt = function (imgUri) {
    console.log("WNP", "Set Album Art", imgUri);
    this.r.albumArt.src = imgUri;
    this.r.bgAlbumArtBlur.style.backgroundImage = "url('" + imgUri + "')";
};

/**
 * Come up with a random album art URI (locally from the img folder).
 * @param {string} prefix - The prefix for the album art URI, i.e. 'fake-album-'
 * @returns {string} An URI for album art
 */
WNP.rndAlbumArt = function (prefix) {
    return "./img/" + prefix + this.rndNumber(1, 16) + ".jpg";
};

/**
 * Get a random number between min and max, including min and max.
 * @param {integer} min - Minimum number to pick, keep it lower than max.
 * @param {integer} max - Maximum number to pick.
 * @returns {integer} The random number
 */
WNP.rndNumber = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Get an identifier for the current play medium combined with the tracksource.
 * TODO: Verify all/most sources...
 * @param {string} playMedium - The PlayMedium as indicated by the device. Values: SONGLIST-NETWORK, RADIO-NETWORK, STATION-NETWORK, CAST, AIRPLAY, SPOTIFY, UNKOWN
 * @param {string} trackSource - The stream source as indicated by the device. Values: Prime, Qobuz, SPOTIFY, newTuneIn, iHeartRadio, Deezer, UPnPServer, Tidal, vTuner
 * @returns {string} The uri to the source identifier (image url)
 */
WNP.getSourceIdent = function (playMedium, trackSource) {

    var sIdentUri = "";

    switch (playMedium.toLowerCase()) {
        case "airplay":
            sIdentUri = "./img/sources/airplay2.png";
            break;
        case "third-dlna":
            sIdentUri = "./img/sources/dlna2.png";
            break;
        case "cast":
            sIdentUri = "./img/sources/chromecast2.png";
            break;
        case "radio-network":
            sIdentUri = "./img/sources/radio.png";
            break;
        case "songlist-network":
            sIdentUri = "./img/sources/ethernet2.png";
            break;
        case "spotify":
            sIdentUri = "./img/sources/spotify.png";
            break;
        case "squeezelite":
            sIdentUri = "./img/sources/music-assistant2.png";
            break;
        case "none":
            sIdentUri = "./img/sources/none2.png";
            break;
        case "bluetooth":
            sIdentUri = "./img/sources/bluetooth2.png";
            break;
        case "hdmi":
            sIdentUri = "./img/sources/hdmi2.png";
            break;
        case "line-in":
            sIdentUri = "./img/sources/line-in2.png";
            break;
        case "optical":
            sIdentUri = "./img/sources/spdif2.png";
            break;
    };

    switch (trackSource.toLowerCase()) {
        case "deezer":
        case "deezer2":
            sIdentUri = "./img/sources/deezer.png";
            break;
        case "iheartradio":
            sIdentUri = "./img/sources/iheart.png";
            break;
        case "newtunein":
            sIdentUri = "./img/sources/newtunein.png";
            break;
        case "plex":
            sIdentUri = "./img/sources/plex.png";
            break;
        case "prime":
            sIdentUri = "./img/sources/amazon-music2.png";
            break;
        case "qobuz":
            sIdentUri = "./img/sources/qobuz2.png";
            break;
        case "tidal":
            sIdentUri = "./img/sources/tidal2.png";
            break;
        case "upnpserver":
            sIdentUri = "./img/sources/dlna2.png";
            break;
        case "vtuner":
            sIdentUri = "./img/sources/vtuner2.png";
            break;
    };

    return sIdentUri;

};

/**
 * Get an identifier for the current audio/song quality.
 * TODO: Verify all/most sources...
 * Found so far:
 * 
 * CD Quality: 44.1 KHz/16 bit. Bitrate 1,411 kbps. For mp3 bitrate can vary, but also be 320/192/160/128/... kbps.
 * Hi-Res quality: 96 kHz/24 bit and up. Bitrate 9,216 kbps.
 * 
 * Spotify Lossless: bitrate 700 kbps, 44.1 kHz/24 bit
 * Spotify and Pandora usual bitrate 160 kbps, premium is 320 kbps
 * Tidal has CD quality, and FLAC, MQA, Master, ...
 * Qobuz apparently really has hi-res?
 * Amazon Music (Unlimited) does Atmos?
 * Apple Music -> Airplay 2, does hi-res?
 * YouTube Music -> Cast, does what?
 * 
 * TIDAL -
 * Sample High: "song:quality":"2","song:actualQuality":"LOSSLESS"
 * Sample MQA: "song:quality":"3","song:actualQuality":"HI_RES"
 * Sample FLAC: "song:quality":"4","song:actualQuality":"HI_RES_LOSSLESS"
 * 
 * @param {integer} songQuality - A number identifying the quality, as indicated by the streaming service(?).
 * @param {string} songActualQuality - An indicator for the actual quality, as indicated by the streaming service(?).
 * @param {integer} songBitrate - The current bitrate in kilobit per second.
 * @param {integer} songBitDepth - The current sample depth in bits.
 * @param {integer} songSampleRate - The current sample rate in Hz.
 * @returns {string} The identifier for the audio quality, just a string.
 */
WNP.getQualityIdent = function (songQuality, songActualQuality, songBitrate, songBitDepth, songSampleRate) {
    // console.log(songQuality, songActualQuality, songBitrate, songBitDepth, songSampleRate);

    var sIdent = "";

    if (songBitrate >= 700 && songBitDepth == 24 && songSampleRate == 44100) {
        sIdent = "Lossless";
    }
    if (songBitrate > 1000 && songBitDepth == 16 && songSampleRate == 44100) {
        sIdent = "CD";
    }
    else if (songBitrate > 7000 && songBitDepth >= 24 && songSampleRate >= 96000) {
        sIdent = "Hi-Res";
    }

    // Based of Tidal/Amazon Music Unlimited/Deezer/Qobuz
    switch (songQuality + ":" + songActualQuality) {
        case "2:LOSSLESS": // Tidal
        case ":LOSSLESS": // Tidal
            sIdent = "HIGH";
            break;
        case "3:HI_RES": // Tidal
            sIdent = "MQA";
            break;
        case "4:HI_RES_LOSSLESS": // Tidal
        case ":HI_RES_LOSSLESS": // Tidal
        case "0:LOSSLESS": // Deezer
            sIdent = "FLAC";
            break;
        case ":UHD": // Amazon Music
            sIdent = "ULTRA HD";
            break;
        case ":HD":
            sIdent = "HD"; // Amazon Music
            break;
        case "3:7":
        case "4:27":
            sIdent = "Hi-Res"; // Qobuz
            break;
        case "2:6":
            sIdent = "CD"; // Qobuz
            break;
    };

    return sIdent;

};

// =======================================================
// Start WiiM Now Playing app
WNP.Init();
