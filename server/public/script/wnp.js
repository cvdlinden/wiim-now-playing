// =======================================================
// WiiM Now Playing

// Init Socket.IO
var socket = io();

// =======================================================
// Vars
var serverSettings = null;
var deviceList = null;

// =======================================================
// UI event listeners

btnDevices.addEventListener("click", function () {
    socket.emit("devices-get");
});

btnRefresh.addEventListener("click", function () {
    socket.emit("devices-refresh");
    // Wait for discovery to finish
    setTimeout(() => {
        socket.emit("devices-get");
    }, 5000);
});

deviceChoices.addEventListener("change", function () {
    socket.emit("device-set", this.value);
})

btnReboot.addEventListener("click", function () {
    socket.emit("server-reboot");
});

btnShutdown.addEventListener("click", function () {
    socket.emit("server-shutdown");
});

btnReloadUI.addEventListener("click", function () {
    location.reload();
})

// =======================================================
// Socket definitions

// Initial calls, wait a bit for socket to start
setTimeout(() => {
    socket.emit("server-settings");
    socket.emit("devices-get");
}, 500);

// On server settings
socket.on("server-settings", function (msg) {

    // Store server settings
    serverSettings = msg;

    if (msg.os.userInfo.shell === "/bin/bash") { // RPi has bash, so possibly able to reboot/shutdown.
        btnReboot.disabled = false;
        btnShutdown.disabled = false;
    };

    // Set device name
    if (msg.selectedDevice && msg.selectedDevice.friendlyName) {
        devName.innerText = msg.selectedDevice.friendlyName;
    };

});

// On devices get
socket.on("devices-get", function (msg) {

    // Store and sort device list
    deviceList = msg;
    deviceList.sort((a, b) => { return (a.friendlyName < b.friendlyName) ? -1 : 1 });

    // Clear choices
    deviceChoices.innerHTML = "";

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

// On state
socket.on("state", function (msg) {
    // if (msg && msg.stateTimeStamp && msg.metadataTimeStamp) {
    //     var timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
    //     sTimeStampDiff.innerHTML = "<em>diff = " + timeStampDiff + "s</em>";
    // }
    // else {
    //     sTimeStampDiff.innerHTML = "";
    // }
    var timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
    var sPlayTime = "";
    sPlayTime += (msg.RelTime) ? msg.RelTime : "00:00:00";
    sPlayTime += " - ";
    sPlayTime += (msg.TrackDuration) ? msg.TrackDuration : "00:00:00";
    sPlayTime += " (+" + timeStampDiff + "s)"
    devPlayTime.innerText = sPlayTime;
});

// On metadata
socket.on("metadata", function (msg) {

    // Source detection, needs work...
    // TODO: Wrap it in source icon.
    var sSource = "";
    sSource += (msg.PlayMedium) ? msg.PlayMedium + ": " : "";
    sSource += (msg.TrackSource) ? msg.TrackSource : "";
    mediaSource.innerText = sSource

    // Song, Artist, Album, Subtitle
    var aTitleArtistAlbum = []
    if (msg && msg.trackMetaData) {
        if ((msg.trackMetaData["dc:title"])) { aTitleArtistAlbum.push(msg.trackMetaData["dc:title"]) };
        if ((msg.trackMetaData["upnp:artist"])) { aTitleArtistAlbum.push(msg.trackMetaData["upnp:artist"]) };
        if ((msg.trackMetaData["upnp:album"])) { aTitleArtistAlbum.push(msg.trackMetaData["upnp:album"]) };
    };
    sTitleArtistAlbum.innerText = aTitleArtistAlbum.join(", ");
    mediaTitle.innerText = (msg.trackMetaData && msg.trackMetaData["dc:title"]) ? msg.trackMetaData["dc:title"] : "";
    mediaArtist.innerText = (msg.trackMetaData && msg.trackMetaData["upnp:artist"]) ? msg.trackMetaData["upnp:artist"] : "";
    mediaAlbum.innerText = (msg.trackMetaData && msg.trackMetaData["upnp:album"]) ? msg.trackMetaData["upnp:album"] : "";
    mediaSubTitle.innerText = (msg.trackMetaData && msg.trackMetaData["dc:subtitle"]) ? msg.trackMetaData["dc:subtitle"] : "";

    // Audio quality
    mediaBitRate.innerText = (msg.trackMetaData && msg.trackMetaData["song:bitrate"]) ? msg.trackMetaData["song:bitrate"] + " kpbs" : "";
    mediaBitDepth.innerText = (msg.trackMetaData && msg.trackMetaData["song:format_s"]) ? msg.trackMetaData["song:format_s"] + " bits" : "";
    mediaSampleRate.innerText = (msg.trackMetaData && msg.trackMetaData["song:rate_hz"]) ? (msg.trackMetaData["song:rate_hz"]/1000) + " kHz" : "";
    // Sample High: "song:quality":"2","song:actualQuality":"LOSSLESS"
    // Sample MQA: "song:quality":"3","song:actualQuality":"HI_RES",
    mediaQuality.innerText = (msg.trackMetaData && msg.trackMetaData["song:quality"]) ? msg.trackMetaData["song:quality"] : "";
    mediaActualQuality.innerText = (msg.trackMetaData && msg.trackMetaData["song:actualQuality"]) ? msg.trackMetaData["song:actualQuality"] : "";

    // Album Art
    if (msg && msg.trackMetaData &&
        msg.trackMetaData["upnp:albumArtURI"] &&
        albumArt.src != msg.trackMetaData["upnp:albumArtURI"]) {
        if (msg.trackMetaData["upnp:albumArtURI"].startsWith("http")) {
            setAlbumArt(msg.trackMetaData["upnp:albumArtURI"]);
        }
        else {
            setAlbumArt(rndAlbumArt());
        }
    }
    else if (!msg || !msg.trackMetaData || !msg.trackMetaData["upnp:albumArtURI"]) {
        setAlbumArt(rndAlbumArt());
    }

});

// On device set
socket.on("device-set", function (msg) {
    // Device wissel? Haal 'alles' opnieuw op
    socket.emit("server-settings");
    socket.emit("devices-get");
});

// On device refresh
socket.on("devices-refresh", function (msg) {
    deviceChoices.innerHTML = "<option disabled=\"disabled\">Waiting for devices...</em></li>";
});

// =======================================================
// Helper functions

rndFive = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

rndAlbumArt = function () {
    return "/img/fake-album-" + rndFive(1, 5) + ".png";
}

setAlbumArt = function (imgUri) {
    albumArt.src = imgUri;
    bgAlbumArtBlur.style.backgroundImage = "url('" + imgUri + "')";
}

