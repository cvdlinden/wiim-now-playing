// =======================================================
// WiiM Now Playing

// var myApp = {

//     vars: {
//         serverSettings: null,
//         deviceList: null,
//         prevTransportState: null
//     },

//     someFunc: () => {
//         self = this;
//         console.log("someFunc")
//         console.log(serverSettings)
//         console.log(this.serverSettings)
//         console.log(this)
//         console.log(myApp.vars)
//     }

// };

// Init Socket.IO
var socket = io();

// =======================================================
// Vars
var serverSettings = null;
var deviceList = null;
var prevTransportState = null;

// =======================================================
// UI event listeners

// btnDevices.addEventListener("click", function () {
//     socket.emit("devices-get");
// });

// btnRefresh.addEventListener("click", function () {
//     socket.emit("devices-refresh");
//     // Wait for discovery to finish
//     setTimeout(() => {
//         socket.emit("devices-get");
//     }, 5000);
// });

// deviceChoices.addEventListener("change", function () {
//     socket.emit("device-set", this.value);
// })

// btnReboot.addEventListener("click", function () {
//     socket.emit("server-reboot");
// });

// btnShutdown.addEventListener("click", function () {
//     socket.emit("server-shutdown");
// });

// btnReloadUI.addEventListener("click", function () {
//     location.reload();
// })

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

    // // Clear choices
    // deviceChoices.innerHTML = "";

    // // Add WiiM devices
    // var devicesWiiM = deviceList.filter((d) => { return d.manufacturer.startsWith("Linkplay") });
    // if (devicesWiiM.length > 0) {
    //     var optGroup = document.createElement("optgroup");
    //     optGroup.label = "WiiM devices";
    //     devicesWiiM.forEach((device) => {
    //         var opt = document.createElement("option");
    //         opt.value = device.location;
    //         opt.innerText = device.friendlyName;
    //         opt.title = "By " + device.manufacturer;
    //         if (serverSettings && serverSettings.selectedDevice && serverSettings.selectedDevice.location === device.location) {
    //             opt.setAttribute("selected", "selected");
    //         };
    //         optGroup.appendChild(opt);
    //     })
    //     deviceChoices.appendChild(optGroup);
    // };

    // // Other devices
    // var devicesOther = deviceList.filter((d) => { return !d.manufacturer.startsWith("Linkplay") });
    // if (devicesOther.length > 0) {
    //     var optGroup = document.createElement("optgroup");
    //     optGroup.label = "Other devices";
    //     devicesOther.forEach((device) => {
    //         var opt = document.createElement("option");
    //         opt.value = device.location;
    //         opt.innerText = device.friendlyName;
    //         opt.title = "By " + device.manufacturer;
    //         if (serverSettings && serverSettings.selectedDevice && serverSettings.selectedDevice.location === device.location) {
    //             opt.setAttribute("selected", "selected");
    //         };
    //         optGroup.appendChild(opt);
    //     })
    //     deviceChoices.appendChild(optGroup);

    // };

    // if (devicesWiiM.length == 0 && devicesOther.length == 0) {
    //     deviceChoices.innerHTML = "<option disabled=\"disabled\">No devices found!</em></li>";
    // };

});

// On state
socket.on("state", function (msg) {

    // Get current player progress
    var timeStampDiff = (msg.stateTimeStamp && msg.metadataTimeStamp) ? Math.round((msg.stateTimeStamp - msg.metadataTimeStamp) / 1000) : 0;
    var relTime = (msg.RelTime) ? msg.RelTime : "00:00:00";
    var trackDuration = (msg.TrackDuration) ? msg.TrackDuration : "00:00:00";
    const progress = getPlayerProgress(relTime, trackDuration, timeStampDiff);
    progressStart.children[0].innerText = progress.start;
    progressEnd.children[0].innerText = progress.end;
    progressPercent.setAttribute("style", "width:" + progress.percent + "%");;

    // Did the device start playing? Maybe fetch some new metadata.
    if (prevTransportState != msg.CurrentTransportState && msg.CurrentTransportState === "PLAYING") {
        console.log("TransportState changed to PLAYING! -> Should fetch new metadata...")
    };
    prevTransportState = msg.CurrentTransportState;

});

// 
getPlayerProgress = function (relTime, trackDuration, timeStampDiff) {
    let relTimeSec = convertToSeconds(relTime) + timeStampDiff;
    let trackDurationSec = convertToSeconds(trackDuration);
    let percentPlayed = 0;
    if (trackDurationSec > 0) {
        percentPlayed = Math.floor(relTimeSec / (trackDurationSec / 100));
        return {
            start: convertToTime(relTimeSec),
            end: convertToTime(trackDurationSec),
            percent: percentPlayed
        };
    }
    else {
        return {
            start: "Live",
            end: "",
            percent: 0
        };
    };
};

// Convert time format '00:00:00' to total seconds.
convertToSeconds = function (sDuration) {
    const timeSections = sDuration.split(":");
    let totalSeconds = 0;
    for (let i = 0; i < timeSections.length; i++) {
        nFactor = timeSections.length - 1 - i;
        nMultiplier = Math.pow(60, nFactor);
        totalSeconds += nMultiplier * parseInt(timeSections[i]);
    }
    return totalSeconds
}

// Convert number of seconds to '00:00' string format. Sorry for those hour+ long songs.
convertToTime = function (seconds) {
    var tempDate = new Date(0);
    tempDate.setSeconds(seconds);
    var result = tempDate.toISOString().substring(14, 19);
    return result;
};


// On metadata
socket.on("metadata", function (msg) {

    // Source detection, needs work...
    // TODO: Wrap it in source icon.
    var sSource = "";
    sSource += (msg.PlayMedium) ? msg.PlayMedium + ": " : "";
    sSource += (msg.TrackSource) ? msg.TrackSource : "";
    mediaSource.innerText = sSource

    // Song, Artist, Album, Subtitle
    mediaTitle.innerText = (msg.trackMetaData && msg.trackMetaData["dc:title"]) ? msg.trackMetaData["dc:title"] : "";
    mediaArtist.innerText = (msg.trackMetaData && msg.trackMetaData["upnp:artist"]) ? msg.trackMetaData["upnp:artist"] : "";
    mediaAlbum.innerText = (msg.trackMetaData && msg.trackMetaData["upnp:album"]) ? msg.trackMetaData["upnp:album"] : "";
    mediaSubTitle.innerText = (msg.trackMetaData && msg.trackMetaData["dc:subtitle"]) ? msg.trackMetaData["dc:subtitle"] : "";

    // Audio quality
    mediaBitRate.innerText = (msg.trackMetaData && msg.trackMetaData["song:bitrate"]) ? msg.trackMetaData["song:bitrate"] + " kpbs" : "";
    mediaBitDepth.innerText = (msg.trackMetaData && msg.trackMetaData["song:format_s"]) ? msg.trackMetaData["song:format_s"] + " bits" : "";
    mediaSampleRate.innerText = (msg.trackMetaData && msg.trackMetaData["song:rate_hz"]) ? (msg.trackMetaData["song:rate_hz"] / 1000) + " kHz" : "";
    // Sample High: "song:quality":"2","song:actualQuality":"LOSSLESS"
    // Sample MQA: "song:quality":"3","song:actualQuality":"HI_RES",
    // Sample FLAC: "4","song:actualQuality":"HI_RES_LOSSLESS", "TrackURI":"https://sp-pr-fa.audio.tidal.com/mediatracks/CAEaKRInZDQxN2NmYzZkNmNmNzQ0YjI4N2QzYWFlNzQzZjliM2NfNjIubXA0/0.flac?token=1707106396~NGQ4Y2JkYWJkZWM2N2I0MDQzZWE1MWNhNDc4ZDExYmE2ZWJmYTVlMw=="
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

    // Device volume
    devVol.innerText = (msg.CurrentVolume) ? msg.CurrentVolume : "-";

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

rndNumber = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

rndAlbumArt = function () {
    return "/img/fake-album-" + rndNumber(1, 5) + ".png";
}

setAlbumArt = function (imgUri) {
    albumArt.src = imgUri;
    bgAlbumArtBlur.style.backgroundImage = "url('" + imgUri + "')";
}

