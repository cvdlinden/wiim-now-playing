// =======================================================
// WiiM Now Playing (Debug)
// Debugging script for the WiiM Now Playing server

// Namespacing
window.WNPd = window.WNPd || {};

// Default settings
WNPd.s = {
    // Device selection
    aDeviceUI: ["btnDevices", "btnRefresh", "btnAddDevices", "btnSaveDevices", "btnAddDevice", "deviceChoices", "deviceName", "deviceIpAddress"],
    // Server actions to be used in the app
    aServerUI: ["btnReboot", "btnUpdate", "btnShutdown", "btnReloadUI"],
    // Ticks to be used in the app (debug)
    aTicksUI: ["tickDevicesGetUp", "tickDevicesRefreshUp", "tickServerSettingsUp", "tickStateUp", "tickStateDown", "tickMetadataUp", "tickMetadataDown", "tickDeviceSetUp", "tickDeviceSetDown", "tickServerSettingsDown", "tickDevicesGetDown", "tickDevicesRefreshDown", "tickSaveDevicesUp", "tickSaveDevicesDown"],
    // Debug UI elements
    aDebugUI: ["state", "metadata", "sServerSettings", "sFriendlyname", "sManufacturer", "sModelName", "sLocation", "sServerUrlHostname", "sServerUrlIP", "sTimeStampDiff", "sTitle", "sArtist", "sAlbum", "sAlbumArtUri", "sSubtitle", "addDeviceModal", "manualDeviceList"]
};

// Data placeholders.
WNPd.d = {
    serverSettings: null,
    deviceList: null
};

// Reference placeholders.
// These are set in the init function
// and are used to reference the UI elements in the app.
WNPd.r = {};

/**
 * Initialisation of app.
 * @returns {undefined}
 */
WNPd.Init = function () {
    console.log("WNPd", "Initialising...");

    // Init Socket.IO, connect to port where server resides
    // Normally on port 80, but in cases where another port is chosen adapt
    if (location.port != "80" && location.port != "1234") {
        console.log("WNPd", "Listening on " + location.href)
        window.socket = io.connect(":" + location.port);
    }
    else {
        console.log("WNPd", "Listening on " + location.hostname + ":80")
        window.socket = io.connect(":80");
    }

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
        this.r.tickServerSettingsUp.classList.add("tickAnimate");
        socket.emit("server-settings");
        this.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
    }, 500);

};

/**
 * Reference to the UI elements of the app.
 * @returns {undefined}
 */
WNPd.setUIReferences = function () {
    console.log("WNPd", "Set UI references...")

    // Set references to the UI elements
    this.s.aDeviceUI.forEach((btn) => {
        this.r[btn] = document.getElementById(btn);
    });
    this.s.aServerUI.forEach((btn) => {
        this.r[btn] = document.getElementById(btn);
    });
    this.s.aTicksUI.forEach((tick) => {
        this.r[tick] = document.getElementById(tick);
    });
    this.s.aDebugUI.forEach((debug) => {
        this.r[debug] = document.getElementById(debug);
    });

};

/**
 * Set the tick event handlers for the app.
 * @returns {undefined}
 */
WNPd.setTickHandlers = function () {

    function removeTickAnimate(e) {
        e.srcElement.classList.remove("tickAnimate");
    }

    // Set the tick handlers for the app
    this.s.aTicksUI.forEach((tick) => {
        this.r[tick].addEventListener("animationend", removeTickAnimate);
    });

};

/**
 * Setting the listeners on the UI elements of the app.
 * @returns {undefined}
 */
WNPd.setUIListeners = function () {
    console.log("WNPd", "Set UI Listeners...")

    // ------------------------------------------------
    // Buttons

    this.r.btnDevices.addEventListener("click", function () {
        WNPd.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
    });

    this.r.btnRefresh.addEventListener("click", function () {
        WNPd.r.tickDevicesRefreshUp.classList.add("tickAnimate");
        socket.emit("devices-refresh");
        // Wait for discovery to finish
        setTimeout(() => {
            WNPd.r.tickDevicesGetUp.classList.add("tickAnimate");
            socket.emit("devices-get");
            WNPd.r.tickServerSettingsUp.classList.add("tickAnimate");
            socket.emit("server-settings");
        }, 5000);
    });

    this.r.btnAddDevices.addEventListener("click", function () {

        // Show add device modal
        let modal = new bootstrap.Modal(addDeviceModal);
        modal.show();

        // Clear choices
        manualDeviceList.innerHTML = "";

        // Filter manually added devices
        var devicesOther = WNPd.d.deviceList.filter((d) => { return !d.manufacturer.startsWith("Linkplay") });
        if (devicesOther.length > 0) {
            for (let i = 0; i < devicesOther.length; i++) {
                var div = document.createElement("div");
                div.classList.add("input-group", "mb-3");
                div.id = "manualDevice" + i;

                var deviceName = document.createElement("input");
                deviceName.type = "text";
                deviceName.classList.add("form-control");
                deviceName.setAttribute("aria-label", "DeviceName");
                deviceName.disabled = true;
                deviceName.value = devicesOther[i].friendlyName;
                div.appendChild(deviceName);

                var deviceIpAddress = document.createElement("input");
                deviceIpAddress.type = "text";
                deviceIpAddress.classList.add("form-control");
                deviceIpAddress.setAttribute("aria-label", "IpAddress");
                deviceIpAddress.disabled = true;
                deviceIpAddress.value = devicesOther[i].location;
                div.appendChild(deviceIpAddress);

                var btnRemoveDevice = document.createElement("button");
                btnRemoveDevice.id = "btnRemoveDevice" + i;
                btnRemoveDevice.classList.add("btn", "btn-outline-secondary");
                btnRemoveDevice.type = "button";
                btnRemoveDevice.setAttribute("onclick", "WNPd.RemoveDevice(" + i + ")");
                var iRemoveDevice = document.createElement("i");
                iRemoveDevice.classList.add("bi", "bi-trash3");
                btnRemoveDevice.appendChild(iRemoveDevice);
                div.appendChild(btnRemoveDevice);

                manualDeviceList.appendChild(div);
            }
        };

    });

    this.r.btnSaveDevices.addEventListener("click", function () {
        // TODO: Grab the list of devices to json format and send it to the back-end
        var msg = [{ "foo": "bar" }];
        WNPd.r.tickSaveDevicesUp.classList.add("tickAnimate");
        socket.emit("devices-update-manual", msg)
    });

    this.r.btnAddDevice.addEventListener("click", function () {
        if (!deviceName.value && !deviceIpAddress.value) {
            return;
        }
        var device = {
            "friendlyName": deviceName.value,
            "location": "http://" + deviceIpAddress.value + ":49152/description.xml",
            "manufacturer": "",
            "modelName": "",
            "actions": { "Manual": null }
        };
        console.log("ADD DEVICE!", device)
        // Reset fields
        deviceName.value = "";
        deviceIpAddress.value = "";
    });

    this.r.deviceChoices.addEventListener("change", function () {
        WNPd.r.tickDeviceSetUp.classList.add("tickAnimate");
        socket.emit("device-set", this.value);
    })

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
    })

};

/**
 * Set the socket definitions to listen for specific websocket traffic and handle accordingly.
 * @returns {undefined}
 */
WNPd.setSocketDefinitions = function () {
    console.log("WNPd", "Setting Socket definitions...")

    // On server settings
    socket.on("server-settings", function (msg) {
        console.log("IO: server-settings", msg);
        WNPd.r.tickServerSettingsDown.classList.add("tickAnimate");

        // Store server settings
        WNPd.d.serverSettings = msg;
        WNPd.r.sServerSettings.innerHTML = JSON.stringify(msg);

        // RPi has bash, so possibly able to reboot/shutdown.
        if (msg.os.userInfo.shell === "/bin/bash") {
            btnReboot.disabled = false;
            btnUpdate.disabled = false;
            btnShutdown.disabled = false;
        };

        // Set device name
        WNPd.r.sFriendlyname.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.friendlyName) ? msg.selectedDevice.friendlyName : "-";
        WNPd.r.sManufacturer.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.manufacturer) ? msg.selectedDevice.manufacturer : "-";
        WNPd.r.sModelName.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.modelName) ? msg.selectedDevice.modelName : "-";
        WNPd.r.sLocation.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.location) ? msg.selectedDevice.location : "-";

        // Set the server url(s)
        if (msg && msg.os && msg.os.hostname) {
            var sUrl = "http://" + msg.os.hostname.toLowerCase() + ".local";
            sUrl += (msg.server && msg.server.port && msg.server.port != 80) ? ":" + msg.server.port + "/" : "/";
            WNPd.r.sServerUrlHostname.children[0].innerText = sUrl;
        }
        else {
            WNPd.r.sServerUrlHostname.children[0].innerText = "-";
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
                    sUrl += (msg.server && msg.server.port && msg.server.port != 80) ? ":" + msg.server.port + "/" : "/";
                    WNPd.r.sServerUrlIP.children[0].innerText = sUrl;
                }
            });
        }
        else {
            WNPd.r.sServerUrlIP.children[0].innerText = "-";
        }

    });

    // On devices get
    socket.on("devices-get", function (msg) {
        console.log("IO: devices-get", msg);
        WNPd.r.tickDevicesGetDown.classList.add("tickAnimate");

        // Store and sort device list
        WNPd.d.deviceList = msg;
        WNPd.d.deviceList.sort((a, b) => { return (a.friendlyName < b.friendlyName) ? -1 : 1 });

        // Clear choices
        WNPd.r.deviceChoices.innerHTML = "<option value=\"\">Select a device...</em></li>";

        // Add WiiM devices
        var devicesWiiM = WNPd.d.deviceList.filter((d) => { return d.manufacturer.startsWith("Linkplay") });
        if (devicesWiiM.length > 0) {
            var optGroup = document.createElement("optgroup");
            optGroup.label = "WiiM devices";
            devicesWiiM.forEach((device) => {
                var opt = document.createElement("option");
                opt.value = device.location;
                opt.innerText = device.friendlyName;
                opt.title = "By " + device.manufacturer;
                if (WNPd.d.serverSettings && WNPd.d.serverSettings.selectedDevice && WNPd.d.serverSettings.selectedDevice.location === device.location) {
                    opt.setAttribute("selected", "selected");
                };
                optGroup.appendChild(opt);
            })
            WNPd.r.deviceChoices.appendChild(optGroup);
        };

        // Other devices
        var devicesOther = WNPd.d.deviceList.filter((d) => { return !d.manufacturer.startsWith("Linkplay") });
        if (devicesOther.length > 0) {
            var optGroup = document.createElement("optgroup");
            optGroup.label = "Other devices";
            devicesOther.forEach((device) => {
                var opt = document.createElement("option");
                opt.value = device.location;
                opt.innerText = device.friendlyName;
                opt.title = "By " + device.manufacturer;
                if (WNPd.d.serverSettings && WNPd.d.serverSettings.selectedDevice && WNPd.d.serverSettings.selectedDevice.location === device.location) {
                    opt.setAttribute("selected", "selected");
                };
                optGroup.appendChild(opt);
            })
            WNPd.r.deviceChoices.appendChild(optGroup);

        };

        if (devicesWiiM.length == 0 && devicesOther.length == 0) {
            WNPd.r.deviceChoices.innerHTML = "<option disabled=\"disabled\">No devices found!</em></li>";
        };

    });

    // On state
    socket.on("state", function (msg) {
        if (!msg) { return false; }
        // console.log("IO: state", msg);
        
        WNPd.r.tickStateDown.classList.add("tickAnimate");
        WNPd.r.state.innerHTML = JSON.stringify(msg);
        if (msg && msg.stateTimeStamp && msg.metadataTimeStamp) {
            var timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
            WNPd.r.sTimeStampDiff.innerHTML = timeStampDiff + "s";
        }
        else {
            WNPd.r.sTimeStampDiff.innerHTML = "";
        }
    });

    // On metadata
    socket.on("metadata", function (msg) {
        // console.log("IO: metadata", msg);
        WNPd.r.tickMetadataDown.classList.add("tickAnimate");
        WNPd.r.metadata.innerHTML = JSON.stringify(msg);
        WNPd.r.sTitle.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["dc:title"]) ? msg.trackMetaData["dc:title"] : "-";
        WNPd.r.sArtist.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:artist"]) ? msg.trackMetaData["upnp:artist"] : "-";
        WNPd.r.sAlbum.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:album"]) ? msg.trackMetaData["upnp:album"] : "-";
        WNPd.r.sAlbumArtUri.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:albumArtURI"]) ? msg.trackMetaData["upnp:albumArtURI"] : "-";
        WNPd.r.sSubtitle.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["dc:subtitle"]) ? msg.trackMetaData["dc:subtitle"] : "-";
    });

    // On device set
    socket.on("device-set", function (msg) {
        console.log("IO: device-set", msg);
        WNPd.r.tickDeviceSetDown.classList.add("tickAnimate");
        // Device wissel? Haal 'alles' opnieuw op
        WNPd.r.tickServerSettingsUp.classList.add("tickAnimate");
        socket.emit("server-settings");
        WNPd.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
    });

    // On device refresh
    socket.on("devices-refresh", function (msg) {
        console.log("IO: devices-refresh", msg);
        WNPd.r.tickDevicesRefreshDown.classList.add("tickAnimate");
        WNPd.r.deviceChoices.innerHTML = "<option disabled=\"disabled\">Waiting for devices...</em></li>";
    });

    // On devices update manual
    socket.on("devices-update-manual", function (msg) {
        console.log("IO: devices-update-manual", msg)
        WNPd.r.tickSaveDevicesDown.classList.add("tickAnimate");
        socket.emit("devices-get");
        // Hide add device modal
        let modal = bootstrap.Modal.getInstance(addDeviceModal);
        modal.hide();
    });

};

/**
 * Remove device from the list of manually added devices.
 * @param {number} n - The index of the device to remove.
 * @returns {undefined}
 */
WNPd.RemoveDevice = function (n) {
    console.log("REMOVE", n)
};

// =======================================================
// Start WiiM Now Playing debugger
WNPd.Init();
