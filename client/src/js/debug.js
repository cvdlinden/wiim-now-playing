// =======================================================
// WiiM Now Playing (Debug)
// Debugging script for the WiiM Now Playing server

// Namespacing
window.WNP = window.WNP || {};

// Default settings
WNP.s = {
    // Device selection
    aDeviceUI: ["btnRefresh", "selDeviceChoices", "btnDevices", "btnAddDevices", "btnSaveDevices", "btnAddDevice", "txtDeviceName", "txtDeviceIpAddress"],
    // Server actions to be used in the app
    aServerUI: ["btnReboot", "btnUpdate", "btnShutdown", "btnReloadUI"],
    // Ticks to be used in the app (debug)
    aTicksUI: ["tickDevicesGetUp", "tickDevicesRefreshUp", "tickServerSettingsUp", "tickStateUp", "tickStateDown", "tickMetadataUp", "tickMetadataDown", "tickDeviceSetUp", "tickDeviceSetDown", "tickServerSettingsDown", "tickDevicesGetDown", "tickDevicesRefreshDown", "tickSaveDevicesUp", "tickSaveDevicesDown"],
    // Debug UI elements
    aDebugUI: ["state", "metadata", "sServerSettings", "sFriendlyname", "sManufacturer", "sModelName", "sLocation", "sServerUrlHostname", "sServerUrlIP", "sTimeStampDiff", "sTitle", "sArtist", "sAlbum", "sAlbumArtUri", "sSubtitle", "addDeviceModal", "manualDeviceList"]
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
    // Normally on port 80, but in cases where another port is chosen adapt
    if (location.port != "80" && location.port != "1234") {
        console.log("WNP DEBUG", "Listening on " + location.href)
        window.socket = io.connect(":" + location.port);
    }
    else {
        console.log("WNP DEBUG", "Listening on " + location.hostname + ":80")
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
    // Buttons

    this.r.btnRefresh.addEventListener("click", function () {
        WNP.r.tickDevicesRefreshUp.classList.add("tickAnimate");
        socket.emit("devices-refresh");
        // Wait for discovery to finish
        setTimeout(() => {
            WNP.r.tickDevicesGetUp.classList.add("tickAnimate");
            socket.emit("devices-get");
            WNP.r.tickServerSettingsUp.classList.add("tickAnimate");
            socket.emit("server-settings");
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

    this.r.btnReloadUI.addEventListener("click", function () {
        location.reload();
    });

    this.r.btnDevices.addEventListener("click", function () {
        WNP.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
    });

    this.r.btnAddDevices.addEventListener("click", function () {

        // Show add device modal
        let modal = new bootstrap.Modal(addDeviceModal);
        modal.show();

        // Clear choices
        manualDeviceList.innerHTML = "";

        // Filter manually added devices
        var devicesOther = WNP.d.deviceList.filter((d) => { return !d.manufacturer.startsWith("Linkplay") });
        if (devicesOther.length > 0) {
            for (let i = 0; i < devicesOther.length; i++) {
                var div = document.createElement("div");
                div.classList.add("input-group", "mb-3");
                div.id = "manualDevice" + i;

                var deviceName = document.createElement("input");
                deviceName.type = "text";
                deviceName.classList.add("form-control");
                deviceName.setAttribute("aria-label", "Device Name");
                deviceName.disabled = true;
                deviceName.value = devicesOther[i].friendlyName;
                div.appendChild(deviceName);

                var deviceIpAddress = document.createElement("input");
                deviceIpAddress.type = "text";
                deviceIpAddress.classList.add("form-control");
                deviceIpAddress.setAttribute("aria-label", "Ip Address");
                deviceIpAddress.disabled = true;
                deviceIpAddress.value = devicesOther[i].location;
                div.appendChild(deviceIpAddress);

                var btnRemoveDevice = document.createElement("button");
                btnRemoveDevice.id = "btnRemoveDevice" + i;
                btnRemoveDevice.classList.add("btn", "btn-outline-secondary");
                btnRemoveDevice.type = "button";
                btnRemoveDevice.addEventListener("click", function () {
                    WNP.RemoveDevice(i);
                });
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
        WNP.r.tickSaveDevicesUp.classList.add("tickAnimate");
        socket.emit("devices-update-manual", msg)
    });

    this.r.btnAddDevice.addEventListener("click", function () {
        if (!WNP.r.txtDeviceName.value && !WNP.r.txtDeviceIpAddress.value) {
            return;
        }
        var device = {
            "friendlyName": WNP.r.txtDeviceName.value,
            "location": "http://" + WNP.r.txtDeviceIpAddress.value + ":49152/description.xml",
            "manufacturer": "",
            "modelName": "",
            "actions": { "Manual": null }
        };
        console.log("ADD DEVICE!", device)
        // Reset fields
        WNP.r.txtDeviceName.value = "";
        WNP.r.txtDeviceIpAddress.value = "";
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
        WNP.r.sLocation.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.location) ? msg.selectedDevice.location : "-";

        // Set the server url(s)
        if (msg && msg.os && msg.os.hostname) {
            var sUrl = "http://" + msg.os.hostname.toLowerCase() + ".local";
            sUrl += (msg.server && msg.server.port && msg.server.port != 80) ? ":" + msg.server.port + "/" : "/";
            WNP.r.sServerUrlHostname.children[0].innerText = sUrl;
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
                    sUrl += (msg.server && msg.server.port && msg.server.port != 80) ? ":" + msg.server.port + "/" : "/";
                    WNP.r.sServerUrlIP.children[0].innerText = sUrl;
                }
            });
        }
        else {
            WNP.r.sServerUrlIP.children[0].innerText = "-";
        }

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
    });

    // On device set
    socket.on("device-set", function (msg) {
        console.log("IO: device-set", msg);
        WNP.r.tickDeviceSetDown.classList.add("tickAnimate");
        // Device wissel? Haal 'alles' opnieuw op
        WNP.r.tickServerSettingsUp.classList.add("tickAnimate");
        socket.emit("server-settings");
        WNP.r.tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
    });

    // On device refresh
    socket.on("devices-refresh", function (msg) {
        console.log("IO: devices-refresh", msg);
        WNP.r.tickDevicesRefreshDown.classList.add("tickAnimate");
        WNP.r.selDeviceChoices.innerHTML = "<option disabled=\"disabled\">Waiting for devices...</em></li>";
    });

    // On devices update manual
    socket.on("devices-update-manual", function (msg) {
        console.log("IO: devices-update-manual", msg)
        WNP.r.tickSaveDevicesDown.classList.add("tickAnimate");
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
WNP.RemoveDevice = function (n) {
    console.log("REMOVE DEVICE", n)
};

// =======================================================
// Start WiiM Now Playing debugger
WNP.Init();
