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
    aDeviceUI: ["btnPrev", "btnPlay", "btnNext", "btnRefresh", "selDeviceChoices", "devName", "mediaTitle", "mediaSubTitle", "mediaArtist", "mediaAlbum", "mediaBitRate", "mediaBitDepth", "mediaSampleRate", "mediaQualityIdent", "devVol", "btnRepeat", "btnShuffle", "progressPlayed", "progressLeft", "progressPercent", "mediaSource", "albumArt", "bgAlbumArtBlur", "btnDevSelect", "btnDevVolume"],
    // Server actions to be used in the app
    aServerUI: ["btnReboot", "btnUpdate", "btnShutdown", "btnReloadUI", "sServerUrlHostname", "sServerUrlIP", "sServerVersion", "sClientVersion"],
};

// Data placeholders.
WNP.d = {
    serverSettings: null, // Server settings, used to store the server settings
    deviceList: null, // Device list, used to store the devices found through SSDP
    prevTransportState: null, // Previous transport state, used to detect changes in the transport state
    prevPlayMedium: null, // Previous play medium, used to detect changes in the play medium
    prevSourceIdent: null, // Previous source ident, used to detect changes in the source
    prevTrackInfo: null, // Previous track info, used to detect changes in the metadata
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
    console.log("WNP DEBUG", "Listening on " + this.s.locHostname + ":" + this.s.locPort)
    window.socket = io.connect(":" + this.s.locPort);

    // Set references to the UI elements
    this.setUIReferences();

    // Set Socket.IO definitions
    this.setSocketDefinitions();

    // Set UI event listeners
    this.setUIListeners();

    // Initial calls, wait a bit for socket to start
    setTimeout(() => {
        socket.emit("server-settings");
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
            console.warn("WNP", `Element with ID '${id}' not found in HTML.`);
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

    this.r.btnPrev.addEventListener("click", function () {
        var wnpAction = this.getAttribute("wnp-action");
        if (wnpAction) {
            this.disabled = true;
            socket.emit("device-action", wnpAction);
        }
    });

    this.r.btnPlay.addEventListener("click", function () {
        var wnpAction = this.getAttribute("wnp-action");
        if (wnpAction) {
            this.disabled = true;
            socket.emit("device-action", wnpAction);
        }
    });

    this.r.btnNext.addEventListener("click", function () {
        var wnpAction = this.getAttribute("wnp-action");
        if (wnpAction) {
            this.disabled = true;
            socket.emit("device-action", wnpAction);
        }
    });

    // ------------------------------------------------
    // Device control buttons (only for default GUI)

    if (this.r.btnDevSelect) {
        this.r.btnDevSelect.addEventListener("click", function () {
            console.log("WNP", "Open device selection control");
            // TODO:
            // Opens a selector for devices in a dialog/modal connected to the button.
            // Should also be possible to click the device name itself.
            // Should do the same as per selDeviceChoices change event.
        });
    }

    if (this.r.btnDevVolume) {
        this.r.btnDevVolume.addEventListener("click", function () {
            console.log("WNP", "Open device volume control");
            // TODO:
            // Opens a volume control in a dialog/modal connected to the button.
            // The 'Range' input type should be used for this, but rotated vertically.
            // Changing volume should be done on input change, not on mouse up.
            // Selecting volume should be done in steps of 5 (0, 5, 10, ..., 100).
            // Should also make muting possible.
        });
    }

    // ------------------------------------------------
    // Settings buttons

    this.r.btnRefresh.addEventListener("click", function () {
        socket.emit("devices-refresh");
        // Wait for discovery to finish
        setTimeout(() => {
            socket.emit("devices-get");
            socket.emit("server-settings");
        }, 5000);
    });

    this.r.selDeviceChoices.addEventListener("change", function () {
        socket.emit("device-set", this.value);
    });

    this.r.btnReboot.addEventListener("click", function () {
        socket.emit("server-reboot");
    });

    this.r.btnUpdate.addEventListener("click", function () {
        socket.emit("server-update");
    });

    this.r.btnShutdown.addEventListener("click", function () {
        socket.emit("server-shutdown");
    });

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

        // Store server settings
        WNP.d.serverSettings = msg;

        // RPi has bash, so possibly able to reboot/shutdown.
        if (msg && msg.os && msg.os.userInfo && msg.os.userInfo.shell === "/bin/bash") {
            WNP.r.btnReboot.disabled = false;
            WNP.r.btnUpdate.disabled = false;
            WNP.r.btnShutdown.disabled = false;
        };

        // Set device name
        if (msg.selectedDevice && msg.selectedDevice.friendlyName) {
            WNP.r.devName.innerText = msg.selectedDevice.friendlyName;
        };

        // Set the server url(s) under the settings modal
        if (msg && msg.os && msg.os.hostname) {
            var sUrl = "http://" + msg.os.hostname.toLowerCase() + ".local";
            sUrl += (location && location.port && location.port != 80) ? ":" + location.port + "/" : "/";
            WNP.r.sServerUrlHostname.children[0].innerHTML = "<a href=\"" + sUrl + "\">" + sUrl + "</a>";
        }
        else {
            WNP.r.sServerUrlHostname.children[0].innerText = "-";
        }
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
                    WNP.r.sServerUrlIP.children[0].innerHTML = "<a href=\"" + sUrl + "\">" + sUrl + "</a>";
                }
            });
        }
        else {
            WNP.r.sServerUrlIP.children[0].innerText = "-";
        }

        // Set the server version
        WNP.r.sServerVersion.innerText = (msg && msg.version && msg.version.server) ? msg.version.server : "-";
        // Set the client version
        WNP.r.sClientVersion.innerText = (msg && msg.version && msg.version.client) ? msg.version.client : "-";


    });

    // On devices get
    socket.on("devices-get", function (msg) {

        // Store and sort device list
        WNP.d.deviceList = msg;
        WNP.d.deviceList.sort((a, b) => { return (a.friendlyName < b.friendlyName) ? -1 : 1 });

        // Clear choices
        WNP.r.selDeviceChoices.innerHTML = "<option value=\"\">Select a device...</em></li>";

        // Add WiiM devices
        var devicesWiiM = WNP.d.deviceList.filter((d) => { return d.manufacturer.startsWith("Linkplay") });
        if (devicesWiiM.length > 0) {
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
        var devicesOther = WNP.d.deviceList.filter((d) => { return !d.manufacturer.startsWith("Linkplay") });
        if (devicesOther.length > 0) {
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

        if (devicesWiiM.length == 0 && devicesOther.length == 0) {
            WNP.r.selDeviceChoices.innerHTML = "<option disabled=\"disabled\">No devices found!</em></li>";
        };

    });

    // On state
    socket.on("state", function (msg) {
        if (!msg) { return false; }
        // console.log(msg);

        // Get player progress data from the state message.
        var timeStampDiff = 0;
        if (msg.CurrentTransportState === "PLAYING") {
            timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
        }
        var relTime = (msg.RelTime) ? msg.RelTime : "00:00:00";
        var trackDuration = (msg.TrackDuration) ? msg.TrackDuration : "00:00:00";

        // Get current player progress and set UI elements accordingly.
        var playerProgress = WNP.getPlayerProgress(relTime, trackDuration, timeStampDiff, msg.CurrentTransportState);
        progressPlayed.children[0].innerText = playerProgress.played;
        progressLeft.children[0].innerText = (playerProgress.left != "") ? "-" + playerProgress.left : "";
        progressPercent.setAttribute("aria-valuenow", playerProgress.percent)
        progressPercent.children[0].setAttribute("style", "width:" + playerProgress.percent + "%");

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
        var trackChanged = false;
        var currentTrackInfo = WNP.r.mediaTitle.innerText + "|" + WNP.r.mediaSubTitle.innerText + "|" + WNP.r.mediaArtist.innerText + "|" + WNP.r.mediaAlbum.innerText;
        if (WNP.d.prevTrackInfo !== currentTrackInfo) {
            trackChanged = true;
            WNP.d.prevTrackInfo = currentTrackInfo; // Remember the last track info
            console.log("WNP", "Track changed:", currentTrackInfo);
        }

        // Audio quality
        var songBitrate = (msg.trackMetaData && msg.trackMetaData["song:bitrate"]) ? msg.trackMetaData["song:bitrate"] : "";
        var songBitDepth = (msg.trackMetaData && msg.trackMetaData["song:format_s"]) ? msg.trackMetaData["song:format_s"] : "";
        var songSampleRate = (msg.trackMetaData && msg.trackMetaData["song:rate_hz"]) ? msg.trackMetaData["song:rate_hz"] : "";
        WNP.r.mediaBitRate.innerText = (songBitrate > 0) ? ((songBitrate > 1000) ? (songBitrate / 1000).toFixed(2) + " mbps, " : songBitrate + " kbps, ") : "";
        WNP.r.mediaBitDepth.innerText = (songBitDepth > 0) ? ((songBitDepth > 24) ? "24 bit/" : songBitDepth + " bit/") : ""; // TODO: 32 bits is suspect according to the WiiM app?
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
        var albumArtUri = WNP.checkAlbumArtURI((msg.trackMetaData && msg.trackMetaData["upnp:albumArtURI"]) ? msg.trackMetaData["upnp:albumArtURI"] : "", msg.metadataTimeStamp);

        // Set Album Art, only if the track changed and the URI changed
        if (trackChanged && WNP.r.albumArt.src != albumArtUri) {
            WNP.setAlbumArt(albumArtUri);
        }

        // Device volume
        WNP.r.devVol.innerText = (msg.CurrentVolume) ? msg.CurrentVolume : "-";

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

    // On device set
    socket.on("device-set", function (msg) {
        // Device switch? Fetch settings and device info again.
        socket.emit("server-settings");
        socket.emit("devices-get");
    });

    // On device refresh
    socket.on("devices-refresh", function (msg) {
        WNP.r.selDeviceChoices.innerHTML = "<option disabled=\"disabled\">Waiting for devices...</em></li>";
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
        // var percentPlayed = Math.floor((relTimeSec / trackDurationSec) * 100);
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
 * Error handling is handled by the onerror event on the image itself.
 * @param {string} sAlbumArtUri - The URI of the album art.
 * @param {integer} nTimestamp - The time in milliseconds, used as cache buster.
 * @returns {string} The URI of the album art.
 */
WNP.checkAlbumArtURI = function (sAlbumArtUri, nTimestamp) {
    // If the URI starts with https, the self signed certificate may not trusted by the browser.
    // Hence we always try and load the image through a reverse proxy, ignoring the certificate.
    if (sAlbumArtUri && sAlbumArtUri.startsWith("https")) {
        if (WNP.s.locPort != "80") { // If the server is not running on port 80, we need to add the port to the URI
            return "http://" + WNP.s.locHostname + ":" + WNP.s.locPort + "/proxy?url=" + encodeURIComponent(sAlbumArtUri) + "&ts=" + nTimestamp; // Use the current timestamp as cache buster
        } else {
            return "http://" + WNP.s.locHostname + "/proxy?url=" + encodeURIComponent(sAlbumArtUri) + "&ts=" + nTimestamp; // Use the current timestamp as cache buster
        }
    } else if (sAlbumArtUri && sAlbumArtUri.startsWith("http")) {
        return sAlbumArtUri;
    } else {
        // If not, use the random album art URI
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

    if (songBitrate > 1000 && songBitDepth === 16 && songSampleRate === 44100) {
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
