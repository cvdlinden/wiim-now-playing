// =======================================================
// WiiM Now Playing
// Debugging script for the WiiM Now Playing server

// Namespacing
window.WNP = window.WNP || {};

// Default settings
WNP.s = {
    // Host runs on default port 80, but in cases where another port is chosen adapt
    locHostname: location.hostname,
    locPort: (location.port && location.port != "80" && location.port != "1234") ? location.port : "80",
    rndAlbumArtUri: "./img/fake-album-1.jpg",
    // Device selection
    aDeviceUI: ["btnRefresh", "selDeviceChoices", "devName", "mediaTitle", "mediaSubTitle", "mediaArtist", "mediaAlbum", "mediaBitRate", "mediaBitDepth", "mediaSampleRate", "mediaQualityIdent", "devVol", "mediaSource"],
    // Server actions to be used in the app
    aServerUI: ["btnReboot", "btnUpdate", "btnShutdown", "btnReloadUI", "sServerUrlHostname", "sServerUrlIP", "sServerVersion", "sClientVersion"],
    // Ticks to be used in the app (debug)
    aTicksUI: ["tickDevicesGetUp", "tickDevicesRefreshUp", "tickServerSettingsUp", "tickStateUp", "tickStateDown", "tickMetadataUp", "tickMetadataDown", "tickLyricsUp", "tickLyricsDown", "tickDeviceSetUp", "tickDeviceSetDown", "tickServerSettingsDown", "tickDevicesGetDown", "tickDevicesRefreshDown", "tickVolumeGetUp", "tickVolumeGetDown", "tickVolumeSetUp", "tickVolumeSetDown", "tickPresetsListUp", "tickPresetsListDown"],
    // Debug UI elements
    aDebugUI: ["state", "metadata", "lyrics", "lyricsStatus", "lyricsProvider", "lyricsTrackKey", "lyricsCacheEnabled", "lyricsCacheStatus", "lyricsCacheSize", "lyricsCacheMax", "lyricsCachePrefetchMode", "lyricsCachePrefetchConcurrency", "lyricsPrefetch", "lyricsPrefetchStatus", "lyricsPrefetchTrackKey", "lyricsPrefetchMode", "lyricsPrefetchReason", "sPresetsList", "sServerSettings", "sManufacturer", "sModelName", "sLocation", "sTimeStampDiff", "sAlbumArtUri", "sAlbumArtUriRaw", "sAlbumArtUriStatus", "oPresetsGroup", "btnDevices", "btnGetVolume", "btnSetVolume", "mediaLoopMode", "sTransportState", "sPlayMedium", "sPlayerProgress"]
};

// Data placeholders.
WNP.d = {
    serverSettings: null, // Server settings, used to store the server settings
    deviceList: null, // Device list, used to store the devices found through SSDP
    prevTransportState: null, // Previous transport state, used to detect changes in the transport state
    prevPlayMedium: null, // Previous play medium, used to detect changes in the play medium
    prevSourceIdent: null, // Previous source ident, used to detect changes in the source
    prevTrackInfo: null // Previous track info, used to detect changes in the metadata
};

// Reference placeholders.
// These are set in the init function
// and are used to reference the UI elements in the app.
WNP.r = {};

/**
 * Format bytes into human-readable units.
 * @param {number} bytes - byte value.
 * @returns {string} formatted value.
 */
WNP.formatBytes = function (bytes) {
    if (typeof bytes !== "number" || Number.isNaN(bytes)) {
        return "-";
    }
    if (bytes === 0) {
        return "0 B";
    }
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

WNP.updateLyricsCacheSettings = function () {
    const cacheSettings = WNP.d.serverSettings?.features?.lyrics?.cache || {};
    if (WNP.r.lyricsCacheEnabled) {
        WNP.r.lyricsCacheEnabled.innerText = (typeof cacheSettings.enabled === "boolean")
            ? (cacheSettings.enabled ? "true" : "false")
            : "-";
    }
    if (WNP.r.lyricsCachePrefetchMode) {
        WNP.r.lyricsCachePrefetchMode.innerText = cacheSettings.prefetch || "-";
    }
    if (WNP.r.lyricsCachePrefetchConcurrency) {
        WNP.r.lyricsCachePrefetchConcurrency.innerText = (typeof cacheSettings.maxPrefetchConcurrency === "number")
            ? cacheSettings.maxPrefetchConcurrency
            : "-";
    }
};

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

    // Set tick handlers
    this.setTickHandlers();

    // Set Socket.IO definitions
    this.setSocketDefinitions();

    // Set UI event listeners
    this.setUIListeners();

    // Initial calls, wait a bit for socket to start
    setTimeout(() => {
        // Get server settings
        this.r.tickServerSettingsUp.classList.add("tickAnimate");
        socket.emit("server-settings");
        // Get devices
        this.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
        // // Get volume
        // this.r.tickVolumeGetUp.classList.add("tickAnimate");
        // socket.emit("device-api", "getPlayerStatus");
        // Get presets
        this.r.tickPresetsListUp.classList.add("tickAnimate");
        socket.emit("device-api", "getPresetInfo");
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
            console.warn("WNP", `Element with ID '${id}' not found in current HTML.`);
        }
    }

    // Set references to the UI elements
    this.s.aDeviceUI.forEach((id) => { addElementToRef(id); });
    this.s.aServerUI.forEach((id) => { addElementToRef(id); });
    this.s.aTicksUI.forEach((id) => { addElementToRef(id); });
    this.s.aDebugUI.forEach((id) => { addElementToRef(id); });

};

/**
 * Set the tick event handlers for the app.
 * @returns {undefined}
 */
WNP.setTickHandlers = function () {

    function removeTickAnimate(e) {
        e.target.classList.remove("tickAnimate");
    }

    // Set the tick handlers for the app
    this.s.aTicksUI.forEach((tick) => {
        if (this.r[tick]) {
            this.r[tick].addEventListener("animationend", removeTickAnimate);
        } else {
            console.warn("WNP", `Element with ID '${tick}' not found.`);
        }
    });

};

/**
 * Setting the listeners on the UI elements of the app.
 * @returns {undefined}
 */
WNP.setUIListeners = function () {
    console.log("WNP", "Set UI Listeners...")

    // ------------------------------------------------
    // Player buttons

    // (no player buttons in debug mode)

    // ------------------------------------------------
    // Settings buttons

    // Device selection dropdown
    this.r.selDeviceChoices.addEventListener("change", function () {
        WNP.r.tickDeviceSetUp.classList.add("tickAnimate");
        socket.emit("device-set", this.value);
    });

    // Devices get button
    this.r.btnDevices.addEventListener("click", function () {
        WNP.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
    });

    // Refresh devices button
    this.r.btnRefresh.addEventListener("click", function () {
        WNP.r.tickDevicesRefreshUp.classList.add("tickAnimate");
        socket.emit("devices-refresh");
        // Wait for discovery to finish
        setTimeout(() => {
            WNP.r.tickDevicesGetUp.classList.add("tickAnimate");
            socket.emit("devices-get");
            WNP.r.tickServerSettingsUp.classList.add("tickAnimate");
            socket.emit("server-settings");
            WNP.r.tickPresetsListUp.classList.add("tickAnimate");
            socket.emit("device-api", "getPresetInfo");
        }, 5000);
    });

    // Get volume button
    this.r.btnGetVolume.addEventListener("click", function () {
        WNP.r.tickVolumeGetUp.classList.add("tickAnimate");
        socket.emit("device-api", "getPlayerStatus");
    });

    // Set volume button
    this.r.btnSetVolume.addEventListener("click", function () {
        var volume = parseInt(WNP.r.devVol.value);
        if (isNaN(volume) || volume < 0 || volume > 100) {
            alert("Please enter a valid volume between 0 and 100.");
            return;
        }
        WNP.r.tickVolumeSetUp.classList.add("tickAnimate");
        socket.emit("device-api", "setPlayerCmd:vol:" + volume);
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

};

/**
 * Set the socket definitions to listen for specific websocket traffic and handle accordingly.
 * @returns {undefined}
 */
WNP.setSocketDefinitions = function () {
    console.log("WNP", "Setting Socket definitions...")

    // On server settings
    socket.on("server-settings", function (msg) {
        console.log("IO: server-settings", msg);
        WNP.r.tickServerSettingsDown.classList.add("tickAnimate");

        // Store server settings
        WNP.d.serverSettings = msg;
        WNP.r.sServerSettings.innerHTML = JSON.stringify(msg);

        // RPi has bash, so possibly able to reboot/shutdown.
        if (msg && msg.os && msg.os.userInfo && msg.os.userInfo.shell === "/bin/bash") {
            WNP.r.btnReboot.disabled = false;
            WNP.r.btnUpdate.disabled = false;
            WNP.r.btnShutdown.disabled = false;
        };

        // Set device name
        WNP.r.devName.innerText = (msg && msg.selectedDevice && msg.selectedDevice.friendlyName) ? msg.selectedDevice.friendlyName : "-";
        WNP.r.sManufacturer.innerText = (msg && msg.selectedDevice && msg.selectedDevice.manufacturer) ? msg.selectedDevice.manufacturer : "-";
        WNP.r.sModelName.innerText = (msg && msg.selectedDevice && msg.selectedDevice.modelName) ? msg.selectedDevice.modelName : "-";
        WNP.r.sLocation.innerHTML = (msg && msg.selectedDevice && msg.selectedDevice.location) ? "<a href=\"" + msg.selectedDevice.location + "\">" + msg.selectedDevice.location + "</a>" : "-";

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

        WNP.updateLyricsCacheSettings();

    });

    // On devices get
    socket.on("devices-get", function (msg) {
        console.log("IO: devices-get", msg);
        WNP.r.tickDevicesGetDown.classList.add("tickAnimate");

        // Store and sort device list
        WNP.d.deviceList = msg;
        WNP.d.deviceList.sort((a, b) => { return (a.friendlyName < b.friendlyName) ? -1 : 1 });

        // Clear choices
        WNP.r.selDeviceChoices.innerHTML = "<option value=\"\">Select a device...</em></li>";

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

        };

        // No devices found
        if (devicesWiiM.length == 0 && devicesOther.length == 0) {
            WNP.r.selDeviceChoices.innerHTML = "<option disabled=\"disabled\">No devices found!</em></li>";
        };

    });

    // On state
    socket.on("state", function (msg) {
        if (!msg) { return false; }

        WNP.r.tickStateDown.classList.add("tickAnimate");
        WNP.r.state.innerHTML = JSON.stringify(msg);

        // Get player progress data from the state message.
        var timeStampDiff = 0;
        if (msg.CurrentTransportState === "PLAYING") {
            timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
        }
        var relTime = (msg.RelTime) ? msg.RelTime : "00:00:00";
        var trackDuration = (msg.TrackDuration) ? msg.TrackDuration : "00:00:00";
        WNP.r.sTimeStampDiff.innerHTML = timeStampDiff + "s";

        // Get current player progress and set UI elements accordingly.
        var oPlayerProgress = WNP.getPlayerProgress(relTime, trackDuration, timeStampDiff, msg.CurrentTransportState);
        WNP.r.sPlayerProgress.innerText = JSON.stringify(oPlayerProgress);

        // Device transport state or play medium changed...?
        if (WNP.d.prevTransportState !== msg.CurrentTransportState || WNP.d.prevPlayMedium !== msg.PlayMedium) {
            WNP.r.sTransportState.innerText = msg.CurrentTransportState;
            WNP.r.sPlayMedium.innerText = msg.PlayMedium;
            WNP.d.prevTransportState = msg.CurrentTransportState; // Remember the last transport state
            WNP.d.prevPlayMedium = msg.PlayMedium; // Remember the last PlayMedium
        }

    });

    // On metadata
    socket.on("metadata", function (msg) {
        if (!msg) { return false; }

        WNP.r.tickMetadataDown.classList.add("tickAnimate");
        WNP.r.metadata.innerHTML = JSON.stringify(msg);

        // Source detection
        var playMedium = (msg.PlayMedium) ? msg.PlayMedium : "";
        var trackSource = (msg.TrackSource) ? msg.TrackSource : "";
        var sourceIdent = WNP.getSourceIdent(playMedium, trackSource);
        // Did the source ident change...?
        if (sourceIdent !== WNP.d.prevSourceIdent) {
            if (sourceIdent !== "") {
                mediaSource.innerText = playMedium + ": " + trackSource + " (" + sourceIdent + ")";
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

        // Audio quality
        var songBitrate = (msg.trackMetaData && msg.trackMetaData["song:bitrate"]) ? msg.trackMetaData["song:bitrate"] : "";
        var songBitDepth = (msg.trackMetaData && msg.trackMetaData["song:format_s"]) ? msg.trackMetaData["song:format_s"] : "";
        var songSampleRate = (msg.trackMetaData && msg.trackMetaData["song:rate_hz"]) ? msg.trackMetaData["song:rate_hz"] : "";
        WNP.r.mediaBitRate.innerText = (songBitrate > 0) ? ((songBitrate > 1000) ? (songBitrate / 1000).toFixed(2) + " mbps (" + songBitrate + ")" : songBitrate + " kbps (" + songBitrate + ")") : "";
        WNP.r.mediaBitDepth.innerText = (songBitDepth > 0) ? ((songBitDepth > 24) ? "24 bit (" + songBitDepth + ")" : songBitDepth + " bit (" + songBitDepth + ")") : "";
        WNP.r.mediaSampleRate.innerText = (songSampleRate > 0) ? (songSampleRate / 1000).toFixed(1) + " kHz (" + songSampleRate + ")" : "";

        // Audio quality ident badge (HD/Hi-res/CD/...)
        var songQuality = (msg.trackMetaData && msg.trackMetaData["song:quality"]) ? msg.trackMetaData["song:quality"] : "";
        var songActualQuality = (msg.trackMetaData && msg.trackMetaData["song:actualQuality"]) ? msg.trackMetaData["song:actualQuality"] : "";
        var qualiIdent = WNP.getQualityIdent(songQuality, songActualQuality, songBitrate, songBitDepth, songSampleRate);
        if (qualiIdent !== "") {
            WNP.r.mediaQualityIdent.innerText = qualiIdent + " (" + songQuality + ", " + songActualQuality + ")";
        }
        else {
            WNP.r.mediaQualityIdent.innerText = songQuality + ", " + songActualQuality;
        }

        // Pre-process Album Art uri, if any is available from the metadata.
        var albumArtUriRaw = (msg.trackMetaData && msg.trackMetaData["upnp:albumArtURI"]) ? msg.trackMetaData["upnp:albumArtURI"] : "";
        var albumArtUri = WNP.checkAlbumArtURI(albumArtUriRaw, msg.metadataTimeStamp);

        // Set Album Art, only if the track changed and the URI changed
        var trackChanged = false;
        var currentTrackInfo = WNP.r.mediaTitle.innerText + "|" + WNP.r.mediaSubTitle.innerText + "|" + WNP.r.mediaArtist.innerText + "|" + WNP.r.mediaAlbum.innerText;
        var currentAlbumArt = WNP.r.sAlbumArtUri.innerText;
        if (WNP.d.prevTrackInfo !== currentTrackInfo) {
            trackChanged = true;
            WNP.d.prevTrackInfo = currentTrackInfo; // Remember the last track info
            console.log("WNP", "Track changed:", currentTrackInfo);
        }
        if (trackChanged && currentAlbumArt != albumArtUri) {
            WNP.r.sAlbumArtUriRaw.innerText = albumArtUriRaw;
            WNP.r.sAlbumArtUri.innerText = albumArtUri;
        }

        // Device volume
        WNP.r.devVol.value = (msg.CurrentVolume) ? msg.CurrentVolume : "-"; // Set the volume on the UI

        // Loop mode status
        if (msg.LoopMode) {
            switch (msg.LoopMode) {
                case "5": // repeat-1 | shuffle
                    WNP.r.mediaLoopMode.innerText = "Shuffle enabled, Repeat enabled - loop once";
                    break;
                case "3": // no repeat | shuffle
                    WNP.r.mediaLoopMode.innerText = "Shuffle enabled, Repeat disabled";
                    break;
                case "2": // repeat | shuffle
                    WNP.r.mediaLoopMode.innerText = "Shuffle enabled, Repeat enabled - loop";
                    break;
                case "1": // repeat-1 | no shuffle
                    WNP.r.mediaLoopMode.innerText = "Shuffle disabled, Repeat enabled - loop once";
                    break;
                case "0": // repeat | no shuffle
                    WNP.r.mediaLoopMode.innerText = "Shuffle disabled, Repeat enabled - loop";
                    break;
                default: // no repeat | no shuffle #4
                    WNP.r.mediaLoopMode.innerText = "Shuffle disabled, Repeat disabled";
            }
        }
        else { // Unknown, so set default
            WNP.r.mediaLoopMode.innerText = "Unknown";
        }

    });

    // On lyrics
    socket.on("lyrics", function (msg) {
        console.log("IO: lyrics", msg);
        WNP.r.tickLyricsDown.classList.add("tickAnimate");
        WNP.r.lyrics.innerHTML = JSON.stringify(msg);

        WNP.r.lyricsStatus.innerText = (msg && msg.status) ? msg.status : "-";
        WNP.r.lyricsProvider.innerText = (msg && msg.provider) ? msg.provider : "-";
        WNP.r.lyricsTrackKey.innerText = (msg && msg.trackKey) ? msg.trackKey : "-";

        const diagnostics = msg?.diagnostics || {};
        if (WNP.r.lyricsCacheStatus) {
            WNP.r.lyricsCacheStatus.innerText = diagnostics.cacheStatus || "-";
        }
        if (WNP.r.lyricsCacheSize) {
            WNP.r.lyricsCacheSize.innerText = WNP.formatBytes(diagnostics.cacheSizeBytes);
        }
        if (WNP.r.lyricsCacheMax) {
            WNP.r.lyricsCacheMax.innerText = WNP.formatBytes(diagnostics.cacheMaxBytes);
        }
        WNP.updateLyricsCacheSettings();
    });

    socket.on("lyrics-prefetch", function (msg) {
        console.log("IO: lyrics-prefetch", msg);
        if (WNP.r.lyricsPrefetch) {
            WNP.r.lyricsPrefetch.innerHTML = JSON.stringify(msg);
        }
        if (WNP.r.lyricsPrefetchStatus) {
            WNP.r.lyricsPrefetchStatus.innerText = (msg && msg.status) ? msg.status : "-";
        }
        if (WNP.r.lyricsPrefetchTrackKey) {
            WNP.r.lyricsPrefetchTrackKey.innerText = (msg && msg.trackKey) ? msg.trackKey : "-";
        }
        if (WNP.r.lyricsPrefetchMode) {
            WNP.r.lyricsPrefetchMode.innerText = (msg && msg.mode) ? msg.mode : "-";
        }
        if (WNP.r.lyricsPrefetchReason) {
            WNP.r.lyricsPrefetchReason.innerText = (msg && msg.reason) ? msg.reason : "-";
        }
    });

    // On device set
    socket.on("device-set", function (msg) {
        console.log("IO: device-set", msg);
        WNP.r.tickDeviceSetDown.classList.add("tickAnimate");
        // Device switch? Fetch settings and device info again.
        WNP.r.tickServerSettingsUp.classList.add("tickAnimate");
        socket.emit("server-settings");
        WNP.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
        WNP.r.tickVolumeGetUp.classList.add("tickAnimate");
        socket.emit("device-api", "getPlayerStatus");
        WNP.r.tickPresetsListUp.classList.add("tickAnimate");
        socket.emit("device-api", "getPresetInfo");
    });

    // On device refresh
    socket.on("devices-refresh", function (msg) {
        console.log("IO: devices-refresh", msg);
        WNP.r.tickDevicesRefreshDown.classList.add("tickAnimate");
        WNP.r.selDeviceChoices.innerHTML = "<option disabled=\"disabled\">Waiting for devices...</em></li>";
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
        console.log("IO: device-api", msg, param);
        switch (msg) {
            case "getPresetInfo":
                // Preset info response
                WNP.r.tickPresetsListDown.classList.add("tickAnimate");
                WNP.r.sPresetsList.innerHTML = param ? JSON.stringify(param) : "";
                var sCurrentTitle = WNP.r.mediaTitle.innerText;
                var sCurrentSubtitle = WNP.r.mediaSubTitle.innerText;
                // Update preset buttons
                if (WNP.r.oPresetsGroup) {
                    WNP.r.oPresetsGroup.innerHTML = "";
                    if (param && param.preset_list && param.preset_list.length > 0) {
                        param.preset_list.forEach((preset) => {
                            var btn = document.createElement("button");
                            btn.type = "button";
                            btn.classList = "btn btn-secondary";
                            btn.innerText = preset.number;
                            btn.title = preset.name;
                            if (preset.name === sCurrentTitle || preset.name === sCurrentSubtitle) {
                                btn.classList.add("active");
                            }
                            btn.addEventListener("click", function () {
                                // Load preset
                                socket.emit("device-api", "MCUKeyShortClick:" + preset.number);
                                // Highlight button
                                Array.from(WNP.r.oPresetsGroup.children).forEach((b) => { b.classList.remove("active"); });
                                btn.classList.add("active");
                            });
                            WNP.r.oPresetsGroup.appendChild(btn);
                        });
                    } else {
                        var p = document.createElement("p");
                        p.classList = "form-text text-white";
                        p.innerText = "No presets found";
                        WNP.r.oPresetsGroup.appendChild(p);
                    }
                }
                break;
            case msg.startsWith("MCUKeyShortClick:") ? msg : false:
                // Preset set response, no further action needed
                break;
            case "getPlayerStatus":
                // Player status response
                // Called when getting volume
                WNP.r.tickVolumeGetDown.classList.add("tickAnimate");
                if (param && param.vol !== undefined) {
                    WNP.r.devVol.value = param.vol;
                }
                break;
            case msg.startsWith("setPlayerCmd:vol:") ? msg : false:
                // Volume set response
                WNP.r.tickVolumeSetDown.classList.add("tickAnimate");
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
 * Check if the album art is a valid URI. Returns the URI if valid, otherwise a random URI.
 * This function creates a virtual image element to check if the album art URI is valid.
 * @param {string} sAlbumArtUri - The URI of the album art.
 * @param {integer} nTimestamp - The time in milliseconds, used as cache buster.
 * @returns {string} The URI of the album art.
 */
WNP.checkAlbumArtURI = function (sAlbumArtUri, nTimestamp) {

    // Create a virtual image element to check the album art URI behind the scenes
    var img = new Image();
    // On successful load
    img.onload = function () {
        console.log("WNP", "Album art loaded successfully.", "Size: " + this.width + "x" + this.height + "px");
        WNP.r.sAlbumArtUriStatus.classList = "bi bi-check-circle-fill";
        WNP.r.sAlbumArtUriStatus.title = "Able to load album art";
    };
    // On error loading the image
    img.onerror = function () {
        console.error("WNP", "Failed to load album art:", sAlbumArtUri);
        WNP.r.sAlbumArtUriStatus.classList = "bi bi-x-circle-fill";
        WNP.r.sAlbumArtUriStatus.title = "Unable to load album art";
    };

    // If the URI starts with https, the self signed certificate may not trusted by the browser.
    // Hence we always try and load the image through a reverse proxy, ignoring the certificate.
    if (sAlbumArtUri && sAlbumArtUri.startsWith("https")) {
        var sAlbumArtProxyUri = "";
        if (WNP.s.locPort != "80") { // If the server is not running on port 80, we need to add the port to the URI
            sAlbumArtProxyUri = "http://" + WNP.s.locHostname + ":" + WNP.s.locPort + "/proxy-art?url=" + encodeURIComponent(sAlbumArtUri) + "&ts=" + nTimestamp; // Use the current timestamp as cache buster
        } else {
            sAlbumArtProxyUri = "http://" + WNP.s.locHostname + "/proxy-art?url=" + encodeURIComponent(sAlbumArtUri) + "&ts=" + nTimestamp; // Use the current timestamp as cache buster
        }
        img.src = sAlbumArtProxyUri; // Test loading the image through the proxy
        return sAlbumArtProxyUri;
    } else if (sAlbumArtUri && sAlbumArtUri.startsWith("http")) {
        img.src = sAlbumArtUri; // Test loading the image directly
        return sAlbumArtUri;
    } else {
        // Looks like an invalid/un_known album art, use the fallback.
        WNP.r.sAlbumArtUriStatus.classList = "bi bi-exclamation-circle-fill";
        WNP.r.sAlbumArtUriStatus.title = "Falling back to random album art";
        return WNP.s.rndAlbumArtUri;
    }
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
// Start WiiM Now Playing app debugger
WNP.Init();
