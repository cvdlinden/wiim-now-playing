// =======================================================
// WiiM Now Playing (Debug)
// Debugging script for the WiiM Now Playing server

// Namespacing
window.WNP = window.WNP || {};

// Default settings
WNP.s = {
    // Host runs on default port 80, but in cases where another port is chosen adapt
    locHostname: location.hostname,
    locPort: (location.port && location.port != "80" && location.port != "1234") ? location.port : "80",
    // Device selection
    aDeviceUI: ["btnRefresh", "selDeviceChoices", "btnDevices", "btnGetVolume", "btnSetVolume", "sVolume"],
    // Server actions to be used in the app
    aServerUI: ["btnReboot", "btnUpdate", "btnShutdown", "btnReloadUI"],
    // Ticks to be used in the app (debug)
    aTicksUI: ["tickDevicesGetUp", "tickDevicesRefreshUp", "tickServerSettingsUp", "tickStateUp", "tickStateDown", "tickMetadataUp", "tickMetadataDown", "tickDeviceSetUp", "tickDeviceSetDown", "tickServerSettingsDown", "tickDevicesGetDown", "tickDevicesRefreshDown", "tickVolumeGetUp", "tickVolumeGetDown", "tickVolumeSetUp", "tickVolumeSetDown", "tickPresetsListUp", "tickPresetsListDown"],
    // Debug UI elements
    aDebugUI: ["state", "metadata", "sPresetsList", "sServerSettings", "sFriendlyname", "sManufacturer", "sModelName", "sLocation", "sServerUrlHostname", "sServerUrlIP", "sServerVersion", "sClientVersion", "sTimeStampDiff", "sTitle", "sArtist", "sAlbum", "sAlbumArtUri", "sSubtitle", "oPresetsGroup"]
};

// Data placeholders.
WNP.d = {
    serverSettings: null,
    deviceList: null
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
    console.log("WNP DEBUG", "Initialising...");

    // Init Socket.IO, connect to port where server resides
    console.log("WNP DEBUG", "Listening on " + this.s.locHostname + ":" + this.s.locPort)
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
        // Get volume
        this.r.tickVolumeGetUp.classList.add("tickAnimate");
        socket.emit("device-api", "getPlayerStatus");
        // Get presets
        this.r.tickPresetsListUp.classList.add("tickAnimate");
        socket.emit("device-api", "getPresetInfo");
    }, 500);

};

/**
 * Reference to the UI elements of the app.
 * @returns {undefined}
 */
WNP.setUIReferences = function () {
    console.log("WNP DEBUG", "Set UI references...")

    function addElementToRef(id) {
        const element = document.getElementById(id);
        if (element) {
            WNP.r[id] = element;
        } else {
            console.warn("WNP DEBUG", `Element with ID '${id}' not found.`);
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
            console.warn("WNP DEBUG", `Element with ID '${tick}' not found.`);
        }
    });

};

/**
 * Setting the listeners on the UI elements of the app.
 * @returns {undefined}
 */
WNP.setUIListeners = function () {
    console.log("WNP DEBUG", "Set UI Listeners...")

    // ------------------------------------------------
    // Settings buttons

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

    this.r.selDeviceChoices.addEventListener("change", function () {
        WNP.r.tickDeviceSetUp.classList.add("tickAnimate");
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

    this.r.btnGetVolume.addEventListener("click", function () {
        WNP.r.tickVolumeGetUp.classList.add("tickAnimate");
        socket.emit("device-api", "getPlayerStatus");
    });

    this.r.btnSetVolume.addEventListener("click", function () {
        var volume = parseInt(WNP.r.sVolume.value);
        if (isNaN(volume) || volume < 0 || volume > 100) {
            alert("Please enter a valid volume between 0 and 100.");
            return;
        }
        WNP.r.tickVolumeSetUp.classList.add("tickAnimate");
        socket.emit("device-api", "setPlayerCmd:vol:" + volume);
    });

    this.r.btnReloadUI.addEventListener("click", function () {
        location.reload();
    });

    this.r.btnDevices.addEventListener("click", function () {
        WNP.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
    });

};

/**
 * Set the socket definitions to listen for specific websocket traffic and handle accordingly.
 * @returns {undefined}
 */
WNP.setSocketDefinitions = function () {
    console.log("WNP DEBUG", "Setting Socket definitions...")

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
        WNP.r.sFriendlyname.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.friendlyName) ? msg.selectedDevice.friendlyName : "-";
        WNP.r.sManufacturer.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.manufacturer) ? msg.selectedDevice.manufacturer : "-";
        WNP.r.sModelName.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.modelName) ? msg.selectedDevice.modelName : "-";
        WNP.r.sLocation.children[0].innerHTML = (msg && msg.selectedDevice && msg.selectedDevice.location) ? "<a href=\"" + msg.selectedDevice.location + "\">" + msg.selectedDevice.location + "</a>" : "-";

        // Set the server url
        if (msg && msg.os && msg.os.hostname) {
            var sUrl = "http://" + msg.os.hostname.toLowerCase() + ".local";
            sUrl += (location && location.port && location.port != 80) ? ":" + location.port + "/" : "/";
            WNP.r.sServerUrlHostname.children[0].innerHTML = "<a href=\"" + sUrl + "\">" + sUrl + "</a>";
        }
        else {
            WNP.r.sServerUrlHostname.children[0].innerText = "-";
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
                    WNP.r.sServerUrlIP.children[0].innerHTML = "<a href=\"" + sUrl + "\">" + sUrl + "</a>";
                }
            });
        }
        else {
            WNP.r.sServerUrlIP.children[0].innerText = "-";
        }

        // Set the server version
        WNP.r.sServerVersion.children[0].innerText = (msg && msg.version && msg.version.server) ? msg.version.server : "-";
        // Set the client version
        WNP.r.sClientVersion.children[0].innerText = (msg && msg.version && msg.version.client) ? msg.version.client : "-";

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
        // console.log("IO: state", msg);

        WNP.r.tickStateDown.classList.add("tickAnimate");
        WNP.r.state.innerHTML = JSON.stringify(msg);
        if (msg && msg.stateTimeStamp && msg.metadataTimeStamp) {
            var timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
            WNP.r.sTimeStampDiff.innerHTML = timeStampDiff + "s";
        }
        else {
            WNP.r.sTimeStampDiff.innerHTML = "";
        }
    });

    // On metadata
    socket.on("metadata", function (msg) {
        // console.log("IO: metadata", msg);
        WNP.r.tickMetadataDown.classList.add("tickAnimate");
        WNP.r.metadata.innerHTML = JSON.stringify(msg);
        WNP.r.sTitle.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["dc:title"]) ? msg.trackMetaData["dc:title"] : "-";
        WNP.r.sArtist.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:artist"]) ? msg.trackMetaData["upnp:artist"] : "-";
        WNP.r.sAlbum.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:album"]) ? msg.trackMetaData["upnp:album"] : "-";
        WNP.r.sAlbumArtUri.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:albumArtURI"]) ? msg.trackMetaData["upnp:albumArtURI"] : "-";
        WNP.r.sSubtitle.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["dc:subtitle"]) ? msg.trackMetaData["dc:subtitle"] : "-";

        // Check the current album art properties
        if (msg && msg.trackMetaData && msg.trackMetaData["upnp:albumArtURI"]) {
            WNP.checkAlbumArtURI(msg.trackMetaData["upnp:albumArtURI"], msg.metadataTimeStamp);
        } else {
            WNP.r.sAlbumArtUri.children[1].classList = "bi bi-info-circle";
            WNP.r.sAlbumArtUri.children[1].title = "No album art URI found";
        };

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
        console.log("WNP DEBUG", "Action:", msg);
    });

    // On device API response
    socket.on("device-api", function (msg, param) {
        console.log("IO: device-api", msg, param);
        switch (msg) {
            case "getPresetInfo":
                // Preset info response
                WNP.r.tickPresetsListDown.classList.add("tickAnimate");
                WNP.r.sPresetsList.innerHTML = param ? JSON.stringify(param) : "";
                var sCurrentTitle = WNP.r.sTitle.children[0].innerText;
                var sCurrentSubtitle = WNP.r.sSubtitle.children[0].innerText;
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
                    WNP.r.sVolume.value = param.vol;
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

};

// =======================================================
// Helper functions

/**
 * Check if the album art is a valid URL and load it.
 * @param {string} sAlbumArtUri - The album art URI to check.
 * @returns {undefined}
 * @description This function creates a virtual image element to check if the album art URI is valid.
 */
WNP.checkAlbumArtURI = function (sAlbumArtUri, nTimestamp) {
    // Create a virtual image element to check the album art URI
    var img = new Image();

    // On successful load
    img.onload = function () {
        console.log("WNP DEBUG", "Album art loaded successfully.", "Size: " + this.width + "x" + this.height + "px");
        WNP.r.sAlbumArtUri.children[1].classList = "bi bi-check-circle-fill";
        WNP.r.sAlbumArtUri.children[1].title = "Able to load album art";
    };
    // On error loading the image
    img.onerror = function () {
        console.error("WNP DEBUG", "Failed to load album art:", sAlbumArtUri);
        WNP.r.sAlbumArtUri.children[1].classList = "bi bi-x-circle-fill";
        WNP.r.sAlbumArtUri.children[1].title = "Unable to load album art";
    };

    // If the URI starts with https, the self signed certificate may not trusted by the browser.
    // Hence we always try and load the image through a reverse proxy, ignoring the certificate.
    if (sAlbumArtUri && sAlbumArtUri.startsWith("https")) {
        img.src = "http://" + WNP.s.locHostname + ":" + WNP.s.locPort + "/proxy-art?url=" + encodeURIComponent(sAlbumArtUri) + "&ts=" + nTimestamp;
    } else if (sAlbumArtUri && sAlbumArtUri.startsWith("http")) {
        img.src = sAlbumArtUri;
    } else {
        // If the URL is invalid, log a warning
        console.warn("WNP DEBUG", "Invalid URL for album art:", sAlbumArtUri);
        WNP.r.sAlbumArtUri.children[1].classList = "bi bi-exclamation-circle-fill";
        WNP.r.sAlbumArtUri.children[1].title = "Invalid album art URI";
    }
};

// =======================================================
// Start WiiM Now Playing debugger
WNP.Init();
