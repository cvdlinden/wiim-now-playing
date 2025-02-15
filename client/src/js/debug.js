// ===================================================================
// Debugging script for the WiiM Now Playing server

// Initialize socket.io
var socket = io.connect('http://localhost:80');

// Initialize buttons
var btnDevices = document.getElementById("btnDevices");
var btnRefresh = document.getElementById("btnRefresh");
var btnAddDevices = document.getElementById("btnAddDevices");
var btnSaveDevices = document.getElementById("btnSaveDevices");
var btnAddDevice = document.getElementById("btnAddDevice");
var deviceName = document.getElementById("deviceName");
var deviceIpAddress = document.getElementById("deviceIpAddress");
var deviceChoices = document.getElementById("deviceChoices");
var btnReboot = document.getElementById("btnReboot");
var btnUpdate = document.getElementById("btnUpdate");
var btnShutdown = document.getElementById("btnShutdown");
var btnReloadUI = document.getElementById("btnReloadUI");
var tickDevicesGetUp = document.getElementById("tickDevicesGetUp");
var tickDevicesRefreshUp = document.getElementById("tickDevicesRefreshUp");
var tickServerSettingsUp = document.getElementById("tickServerSettingsUp");
var tickStateUp = document.getElementById("tickStateUp");
var tickStateDown = document.getElementById("tickStateDown");
var tickMetadataUp = document.getElementById("tickMetadataUp");
var tickMetadataDown = document.getElementById("tickMetadataDown");
var tickDeviceSetUp = document.getElementById("tickDeviceSetUp");
var tickDeviceSetDown = document.getElementById("tickDeviceSetDown");
var tickServerSettingsDown = document.getElementById("tickServerSettingsDown");
var tickDevicesGetDown = document.getElementById("tickDevicesGetDown");
var tickDevicesRefreshDown = document.getElementById("tickDevicesRefreshDown");
var tickSaveDevicesUp = document.getElementById("tickSaveDevicesUp");
var tickSaveDevicesDown = document.getElementById("tickSaveDevicesDown");
var sServerSettings = document.getElementById("sServerSettings");
var sFriendlyname = document.getElementById("sFriendlyname");
var sManufacturer = document.getElementById("sManufacturer");
var sModelName = document.getElementById("sModelName");
var sLocation = document.getElementById("sLocation");
var sServerUrlHostname = document.getElementById("sServerUrlHostname");
var sServerUrlIP = document.getElementById("sServerUrlIP");
var sTimeStampDiff = document.getElementById("sTimeStampDiff");
var state = document.getElementById("state");
var metadata = document.getElementById("metadata");
var sTitle = document.getElementById("sTitle");
var sArtist = document.getElementById("sArtist");
var sAlbum = document.getElementById("sAlbum");
var sAlbumArtUri = document.getElementById("sAlbumArtUri");
var sSubtitle = document.getElementById("sSubtitle");

var addDeviceModal = document.getElementById("addDeviceModal");

// ===================================================================
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

btnSaveDevices.addEventListener("click", function () {
    // TODO: Grab the list of devices to json format and send it to the back-end
    var msg = [ {"foo":"bar"} ];
    tickSaveDevicesUp.classList.add("tickAnimate");
    socket.emit("devices-update-manual", msg)
});

btnAddDevice.addEventListener("click", function() {
    console.log(deviceName.value, deviceIpAddress.value)
    if (!deviceName.value && !deviceIpAddress.value) {
        return;
    }
    var device = {
        "friendlyName": deviceName.value,
        "location": "http://" + deviceIpAddress.value + ":49152/description.xml",
        "manufacturer": "",
        "modelName": "",
        "actions": {"Manual":null}
    
    };
    console.log("ADD DEVICE!", device)
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

// ===================================================================
// Ticks handling

function removeTickAnimate(e) {
    e.srcElement.classList.remove("tickAnimate");
}

tickStateUp.addEventListener("animationend", removeTickAnimate);
tickStateDown.addEventListener("animationend", removeTickAnimate);
tickMetadataUp.addEventListener("animationend", removeTickAnimate);
tickMetadataDown.addEventListener("animationend", removeTickAnimate);
tickDevicesGetUp.addEventListener("animationend", removeTickAnimate);
tickDevicesGetDown.addEventListener("animationend", removeTickAnimate);
tickDevicesRefreshUp.addEventListener("animationend", removeTickAnimate);
tickDevicesRefreshDown.addEventListener("animationend", removeTickAnimate);
tickDeviceSetUp.addEventListener("animationend", removeTickAnimate);
tickDeviceSetDown.addEventListener("animationend", removeTickAnimate);
tickServerSettingsUp.addEventListener("animationend", removeTickAnimate);
tickServerSettingsDown.addEventListener("animationend", removeTickAnimate);
tickSaveDevicesUp.addEventListener("animationend", removeTickAnimate);
tickSaveDevicesDown.addEventListener("animationend", removeTickAnimate);

// ===================================================================
// Generic functions

window.removeDevice = function(n) {
    console.log("REMOVE", n)
};

// ===================================================================
// Socket definitions

// Initial calls, wait a bit for socket to start
var serverSettings = null;
var deviceList = null;
setTimeout(() => {
    tickServerSettingsUp.classList.add("tickAnimate");
    socket.emit("server-settings");
    tickDevicesGetUp.classList.add("tickAnimate");
    socket.emit("devices-get");
    // tick...
    // socket.emit("devices-get-manual"); // Manually added devices are behad by devices-get...
}, 500);

socket.on("server-settings", function (msg) {
    console.log("IO: server-settings", msg);
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
                sServerUrlIP.children[0].innerText = sUrl;
            }
        });
    }
    else {
        sServerUrlIP.children[0].innerText = "-";
    }

});

socket.on("devices-get", function (msg) {
    console.log("IO: devices-get", msg);
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
    console.log("IO: device-set", msg);
    tickDeviceSetDown.classList.add("tickAnimate");
    // Device wissel? Haal 'alles' opnieuw op
    tickServerSettingsUp.classList.add("tickAnimate");
    socket.emit("server-settings");
    tickDevicesGetUp.classList.add("tickAnimate");
    socket.emit("devices-get");
});

socket.on("devices-refresh", function (msg) {
    console.log("IO: devices-refresh", msg);
    tickDevicesRefreshDown.classList.add("tickAnimate");
    deviceChoices.innerHTML = "<option disabled=\"disabled\">Waiting for devices...</em></li>";
});

socket.on("state", function (msg) {
    // console.log("IO: state", msg);
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
    // console.log("IO: metadata", msg);
    tickMetadataDown.classList.add("tickAnimate");
    metadata.innerHTML = JSON.stringify(msg);
    sTitle.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["dc:title"]) ? msg.trackMetaData["dc:title"] : "-";
    sArtist.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:artist"]) ? msg.trackMetaData["upnp:artist"] : "-";
    sAlbum.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:album"]) ? msg.trackMetaData["upnp:album"] : "-";
    sAlbumArtUri.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["upnp:albumArtURI"]) ? msg.trackMetaData["upnp:albumArtURI"] : "-";
    sSubtitle.children[0].innerText = (msg && msg.trackMetaData && msg.trackMetaData["dc:subtitle"]) ? msg.trackMetaData["dc:subtitle"] : "-";
});

socket.on("devices-update-manual", function (msg) {
    console.log("IO: devices-update-manual", msg)
    tickSaveDevicesDown.classList.add("tickAnimate");
    socket.emit("devices-get");
    let modal = bootstrap.Modal.getInstance(addDeviceModal);
    modal.hide();
});
