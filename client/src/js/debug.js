var socket = io.connect(':80');

// DEBUG
// var state = document.getElementById("state");
// var btn = document.getElementById("btn");

// UI event listeners

btnDevices.addEventListener("click", function () {
    tickDevicesGetUp.classList.add("tickAnimate");
    socket.emit("devices-get");
});

btnRefresh.addEventListener("click", function () {
    tickDevicesRefreshUp.classList.add("tickAnimate");
    socket.emit("devices-refresh");
    // Wait for discovery to finish
    setTimeout(() => {
        tickDevicesGetUp.classList.add("tickAnimate");
        socket.emit("devices-get");
        tickServerSettingsUp.classList.add("tickAnimate");
        socket.emit("server-settings");
    }, 5000);
});

deviceChoices.addEventListener("change", function () {
    tickDeviceSetUp.classList.add("tickAnimate");
    socket.emit("device-set", this.value);
})

btnReboot.addEventListener("click", function () {
    socket.emit("server-reboot");
});

btnUpdate.addEventListener("click", function () {
    socket.emit("server-update");
});

btnShutdown.addEventListener("click", function () {
    socket.emit("server-shutdown");
});

btnReloadUI.addEventListener("click", function () {
    location.reload();
})

// Remove tickAnimate from animated ticks
tickStateUp.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickStateDown.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickMetadataUp.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickMetadataDown.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickDevicesGetUp.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickDevicesGetDown.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickDevicesRefreshUp.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickDevicesRefreshDown.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickDeviceSetUp.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickDeviceSetDown.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickServerSettingsUp.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });
tickServerSettingsDown.addEventListener("animationend", (e) => { e.srcElement.classList.remove("tickAnimate"); });

// Sockets

// Initial calls, wait a bit for socket to start
var serverSettings = null;
var deviceList = null;
setTimeout(() => {
    tickServerSettingsUp.classList.add("tickAnimate");
    socket.emit("server-settings");
    tickDevicesGetUp.classList.add("tickAnimate");
    socket.emit("devices-get");
}, 500);

socket.on("server-settings", function (msg) {
    tickServerSettingsDown.classList.add("tickAnimate");

    // Store server settings
    serverSettings = msg;

    sServerSettings.innerHTML = JSON.stringify(msg);
    if (msg.os.userInfo.shell === "/bin/bash") { // RPi has bash, so possibly able to reboot/shutdown.
        btnReboot.disabled = false;
        btnUpdate.disabled = false;
        btnShutdown.disabled = false;
    };

    sFriendlyname.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.friendlyName) ? msg.selectedDevice.friendlyName : "-";
    sManufacturer.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.manufacturer) ? msg.selectedDevice.manufacturer : "-";
    sModelName.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.modelName) ? msg.selectedDevice.modelName : "-";
    sLocation.children[0].innerText = (msg && msg.selectedDevice && msg.selectedDevice.location) ? msg.selectedDevice.location : "-";
    if (msg && msg.os && msg.os.hostname) {
        var sUrl = "http://" + msg.os.hostname.toLowerCase() + ".local";
        sUrl += (msg.server && msg.server.port && msg.server.port != 80) ? ":" + msg.server.port + "/" : "/";
        sServerUrlHostname.children[0].innerText = sUrl;
    }
    else {
        sServerUrlHostname.children[0].innerText = "-";
    }
    if (msg && msg.selectedDevice && msg.selectedDevice.location && msg.os && msg.os.networkInterfaces) {
        // Grab the ip address pattern of the selected device
        // We suspect that the wiim-now-playing server is on the same ip range..
        var sLocationIp = msg.selectedDevice.location.split("/")[2];
        var aIpAddress = sLocationIp.split(".");
        aIpAddress.pop(); // Remove the last part
        var sIpPattern = aIpAddress.join(".");
        console.log("sIpPattern", sIpPattern)
        // Search for an ip address in range...
        Object.keys(msg.os.networkInterfaces).forEach(function (key, index) {
            console.log("KEY", key, msg.os.networkInterfaces[key]);
            var sIpFound = msg.os.networkInterfaces[key].find(addr => addr.address.startsWith(sIpPattern))
            console.log("sIpFound", sIpFound);
            if (sIpFound) {
                // Construct ip address and optional port
                var sUrl = "http://" + sIpFound.address;
                sUrl += (msg.server && msg.server.port && msg.server.port != 80) ? ":" + msg.server.port + "/" : "/";
                sServerUrlIP.children[0].innerText = sUrl;
            }
        });
    }
    else {
        sServerUrlIP.children[0].innerText = "-";
    }

});

socket.on("devices-get", function (msg) {
    tickDevicesGetDown.classList.add("tickAnimate");

    // Store and sort device list
    deviceList = msg;
    deviceList.sort((a, b) => { return (a.friendlyName < b.friendlyName) ? -1 : 1 });

    // Clear choices
    deviceChoices.innerHTML = "<option value=\"\">Select a device...</em></li>";

    // Add WiiM devices
    var devicesWiiM = deviceList.filter((d) => { return d.manufacturer.startsWith("Linkplay") });
    if (devicesWiiM.length > 0) {
        var optGroup = document.createElement("optgroup");
        optGroup.label = "WiiM devices";
        devicesWiiM.forEach((device) => {
            var opt = document.createElement("option");
            opt.value = device.location;
            opt.innerText = device.friendlyName;
            opt.title = "By " + device.manufacturer;
            if (serverSettings && serverSettings.selectedDevice && serverSettings.selectedDevice.location === device.location) {
                opt.setAttribute("selected", "selected");
            };
            optGroup.appendChild(opt);
        })
        deviceChoices.appendChild(optGroup);
    };

    // Other devices
    var devicesOther = deviceList.filter((d) => { return !d.manufacturer.startsWith("Linkplay") });
    if (devicesOther.length > 0) {
        var optGroup = document.createElement("optgroup");
        optGroup.label = "Other devices";
        devicesOther.forEach((device) => {
            var opt = document.createElement("option");
            opt.value = device.location;
            opt.innerText = device.friendlyName;
            opt.title = "By " + device.manufacturer;
            if (serverSettings && serverSettings.selectedDevice && serverSettings.selectedDevice.location === device.location) {
                opt.setAttribute("selected", "selected");
            };
            optGroup.appendChild(opt);
        })
        deviceChoices.appendChild(optGroup);

    };

    if (devicesWiiM.length == 0 && devicesOther.length == 0) {
        deviceChoices.innerHTML = "<option disabled=\"disabled\">No devices found!</em></li>";
    };

});

socket.on("device-set", function (msg) {
    tickDeviceSetDown.classList.add("tickAnimate");
    // Device wissel? Haal 'alles' opnieuw op
    tickServerSettingsUp.classList.add("tickAnimate");
    socket.emit("server-settings");
    tickDevicesGetUp.classList.add("tickAnimate");
    socket.emit("devices-get");
});

socket.on("devices-refresh", function (msg) {
    tickDevicesRefreshDown.classList.add("tickAnimate");
    deviceChoices.innerHTML = "<option disabled=\"disabled\">Waiting for devices...</em></li>";
});

socket.on("state", function (msg) {
    tickStateDown.classList.add("tickAnimate");
    state.innerHTML = JSON.stringify(msg);
    if (msg && msg.stateTimeStamp && msg.metadataTimeStamp) {
        var timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
        sTimeStampDiff.innerHTML = timeStampDiff + "s";
    }
    else {
        sTimeStampDiff.innerHTML = "";
    }
});

socket.on("metadata", function (msg) {
    tickMetadataDown.classList.add("tickAnimate");
    metadata.innerHTML = JSON.stringify(msg);
    sTitle.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["dc:title"]) ? msg.trackMetaData["dc:title"] : "-";
    sArtist.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:artist"]) ? msg.trackMetaData["upnp:artist"] : "-";
    sAlbum.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:album"]) ? msg.trackMetaData["upnp:album"] : "-";
    sAlbumArtUri.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:albumArtURI"]) ? msg.trackMetaData["upnp:albumArtURI"] : "-";
    sSubtitle.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["dc:subtitle"]) ? msg.trackMetaData["dc:subtitle"] : "-";
});
