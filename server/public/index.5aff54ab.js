window.WNP=window.WNP||{},WNP.s={rndAlbumArtUri:"./img/fake-album-1.png",rndRadioArtUri:"./img/webradio-1.png"},WNP.d={serverSettings:null,deviceList:null,prevTransportState:null},WNP.Init=function(){console.log("WNP","Initialising..."),window.socket=io.connect(":80"),this.setSocketDefinitions(),this.setUIListeners(),setTimeout(()=>{socket.emit("server-settings"),socket.emit("devices-get")},500),setInterval(function(){WNP.s.rndAlbumArtUri=WNP.rndAlbumArt("fake-album-"),WNP.s.rndRadioArtUri=WNP.rndAlbumArt("webradio-")},18e4)},WNP.setUIListeners=function(){console.log("WNP","Set UI Listeners..."),btnPrev.addEventListener("click",function(){var e=this.getAttribute("wnp-action");e&&(this.disabled=!0,socket.emit("device-action",e))}),btnPlay.addEventListener("click",function(){var e=this.getAttribute("wnp-action");e&&(this.disabled=!0,socket.emit("device-action",e))}),btnNext.addEventListener("click",function(){var e=this.getAttribute("wnp-action");e&&(this.disabled=!0,socket.emit("device-action",e))}),btnRefresh.addEventListener("click",function(){socket.emit("devices-refresh"),setTimeout(()=>{socket.emit("devices-get"),socket.emit("server-settings")},5e3)}),deviceChoices.addEventListener("change",function(){socket.emit("device-set",this.value)}),btnReboot.addEventListener("click",function(){socket.emit("server-reboot")}),btnShutdown.addEventListener("click",function(){socket.emit("server-shutdown")}),btnReloadUI.addEventListener("click",function(){location.reload()})},WNP.setSocketDefinitions=function(){console.log("WNP","Setting Socket definitions..."),socket.on("server-settings",function(e){WNP.d.serverSettings=e,"/bin/bash"===e.os.userInfo.shell&&(btnReboot.disabled=!1,btnShutdown.disabled=!1),e.selectedDevice&&e.selectedDevice.friendlyName&&(devName.innerText=e.selectedDevice.friendlyName)}),socket.on("devices-get",function(e){WNP.d.deviceList=e,WNP.d.deviceList.sort((e,t)=>e.friendlyName<t.friendlyName?-1:1),deviceChoices.innerHTML='<option value="">Select a device...</em></li>';var t=WNP.d.deviceList.filter(e=>e.manufacturer.startsWith("Linkplay"));if(t.length>0){var a=document.createElement("optgroup");a.label="WiiM devices",t.forEach(e=>{var t=document.createElement("option");t.value=e.location,t.innerText=e.friendlyName,t.title="By "+e.manufacturer,WNP.d.serverSettings&&WNP.d.serverSettings.selectedDevice&&WNP.d.serverSettings.selectedDevice.location===e.location&&t.setAttribute("selected","selected"),a.appendChild(t)}),deviceChoices.appendChild(a)}var n=WNP.d.deviceList.filter(e=>!e.manufacturer.startsWith("Linkplay"));if(n.length>0){var a=document.createElement("optgroup");a.label="Other devices",n.forEach(e=>{var t=document.createElement("option");t.value=e.location,t.innerText=e.friendlyName,t.title="By "+e.manufacturer,WNP.d.serverSettings&&WNP.d.serverSettings.selectedDevice&&WNP.d.serverSettings.selectedDevice.location===e.location&&t.setAttribute("selected","selected"),a.appendChild(t)}),deviceChoices.appendChild(a)}0==t.length&&0==n.length&&(deviceChoices.innerHTML='<option disabled="disabled">No devices found!</em></li>')}),socket.on("state",function(e){if(!e)return!1;var t=0;"PLAYING"===e.CurrentTransportState&&(t=e.stateTimeStamp&&e.metadataTimeStamp?Math.round((e.stateTimeStamp-e.metadataTimeStamp)/1e3):0);var a=e.RelTime?e.RelTime:"00:00:00",n=e.TrackDuration?e.TrackDuration:"00:00:00",i=WNP.getPlayerProgress(a,n,t);progressPlayed.children[0].innerText=i.played,progressLeft.children[0].innerText=""!=i.left?"-"+i.left:"",progressPercent.setAttribute("aria-valuenow",i.percent),progressPercent.children[0].setAttribute("style","width:"+i.percent+"%"),WNP.d.prevTransportState!==e.CurrentTransportState&&("TRANSITIONING"===e.CurrentTransportState&&(btnPlay.children[0].className="bi bi-circle-fill",btnPlay.disabled=!0),"PLAYING"===e.CurrentTransportState?(e.PlayMedium&&"RADIO-NETWORK"===e.PlayMedium?(btnPlay.children[0].className="bi bi-stop-circle-fill",btnPlay.setAttribute("wnp-action","Stop")):(btnPlay.children[0].className="bi bi-pause-circle-fill",btnPlay.setAttribute("wnp-action","Pause")),btnPlay.disabled=!1):("PAUSED_PLAYBACK"===e.CurrentTransportState||"STOPPED"===e.CurrentTransportState)&&(btnPlay.children[0].className="bi bi-play-circle-fill",btnPlay.setAttribute("wnp-action","Play"),btnPlay.disabled=!1),WNP.d.prevTransportState=e.CurrentTransportState),e.PlayMedium&&"RADIO-NETWORK"===e.PlayMedium?(btnPrev.disabled=!0,btnNext.disabled=!0):(btnPrev.disabled=!1,btnNext.disabled=!1)}),socket.on("metadata",function(e){if(!e)return!1;var t=e.PlayMedium?e.PlayMedium:"",a=e.TrackSource?e.TrackSource:"",n=WNP.getSourceIdent(t,a);if(""!==n){var i=document.createElement("img");i.src=n,i.alt=t+": "+a,i.title=t+": "+a,mediaSource.innerHTML=i.outerHTML}else mediaSource.innerText=t+": "+a;mediaTitle.innerText=e.trackMetaData&&e.trackMetaData["dc:title"]?e.trackMetaData["dc:title"]:"",mediaSubTitle.innerText=e.trackMetaData&&e.trackMetaData["dc:subtitle"]?e.trackMetaData["dc:subtitle"]:"",mediaArtist.innerText=e.trackMetaData&&e.trackMetaData["upnp:artist"]?e.trackMetaData["upnp:artist"]+", ":"",mediaAlbum.innerText=e.trackMetaData&&e.trackMetaData["upnp:album"]?e.trackMetaData["upnp:album"]:"";var r=e.trackMetaData&&e.trackMetaData["song:bitrate"]?e.trackMetaData["song:bitrate"]:"",s=e.trackMetaData&&e.trackMetaData["song:format_s"]?e.trackMetaData["song:format_s"]:"",c=e.trackMetaData&&e.trackMetaData["song:rate_hz"]?e.trackMetaData["song:rate_hz"]:"";mediaBitRate.innerText=r>0?r>1e3?(r/1e3).toFixed(2)+" mbps, ":r+" kbps, ":"",mediaBitDepth.innerText=s>0?s>24?"24 bits, ":s+" bits, ":"",mediaSampleRate.innerText=c>0?(c/1e3).toFixed(1)+" kHz":"";var l=e.trackMetaData&&e.trackMetaData["song:quality"]?e.trackMetaData["song:quality"]:"",o=e.trackMetaData&&e.trackMetaData["song:actualQuality"]?e.trackMetaData["song:actualQuality"]:"",d=WNP.getQualityIdent(l,o,r,s,c);if(""!==d)mediaQualityIdent.innerText=d,mediaQualityIdent.title="Quality: "+l+", "+o;else{var u=document.createElement("i");u.className="bi bi-soundwave text-secondary",u.title="Quality: "+l+", "+o,mediaQualityIdent.innerHTML=u.outerHTML}if(e&&e.trackMetaData&&e.trackMetaData["upnp:albumArtURI"]&&albumArt.src!=e.trackMetaData["upnp:albumArtURI"]?e.trackMetaData["upnp:albumArtURI"].startsWith("http")?WNP.setAlbumArt(e.trackMetaData["upnp:albumArtURI"]):WNP.setAlbumArt(WNP.s.rndAlbumArtUri):e&&e.trackMetaData&&e.trackMetaData["upnp:albumArtURI"]||WNP.setAlbumArt(WNP.s.rndAlbumArtUri),devVol.innerText=e.CurrentVolume?e.CurrentVolume:"-",e.LoopMode)switch(e.LoopMode){case"5":btnRepeat.className="btn btn-outline-success",btnRepeat.children[0].className="bi bi-repeat-1",btnShuffle.className="btn btn-outline-success";break;case"3":btnRepeat.className="btn btn-outline-light",btnRepeat.children[0].className="bi bi-repeat",btnShuffle.className="btn btn-outline-success";break;case"2":btnRepeat.className="btn btn-outline-success",btnRepeat.children[0].className="bi bi-repeat",btnShuffle.className="btn btn-outline-success";break;case"1":btnRepeat.className="btn btn-outline-success",btnRepeat.children[0].className="bi bi-repeat-1",btnShuffle.className="btn btn-outline-light";break;case"0":btnRepeat.className="btn btn-outline-success",btnRepeat.children[0].className="bi bi-repeat",btnShuffle.className="btn btn-outline-light";break;default:btnRepeat.className="btn btn-outline-light",btnRepeat.children[0].className="bi bi-repeat",btnShuffle.className="btn btn-outline-light"}else btnRepeat.className="btn btn-outline-light",btnRepeat.children[0].className="bi bi-repeat",btnShuffle.className="btn btn-outline-light"}),socket.on("device-set",function(e){socket.emit("server-settings"),socket.emit("devices-get")}),socket.on("devices-refresh",function(e){deviceChoices.innerHTML='<option disabled="disabled">Waiting for devices...</em></li>'})},WNP.getPlayerProgress=function(e,t,a){var n=this.convertToSeconds(e)+a,i=this.convertToSeconds(t);if(!(i>0)||!(n<i))return{played:"Live",left:"",total:"",percent:0};var r=(n/i*100).toFixed(1);return{played:WNP.convertToMinutes(n),left:WNP.convertToMinutes(i-n),total:WNP.convertToMinutes(i),percent:r}},WNP.convertToSeconds=function(e){let t=e.split(":"),a=0;for(let e=0;e<t.length;e++)a+=Math.pow(60,t.length-1-e)*parseInt(t[e]);return a},WNP.convertToMinutes=function(e){var t=new Date(0);return t.setSeconds(e),t.toISOString().substring(14,19)},WNP.setAlbumArt=function(e){albumArt.src=e,bgAlbumArtBlur.style.backgroundImage="url('"+e+"')"},WNP.rndAlbumArt=function(e){return"./img/"+e+this.rndNumber(1,5)+".png"},WNP.rndNumber=function(e,t){return Math.floor(Math.random()*(t-e+1)+e)},WNP.getSourceIdent=function(e,t){var a="";switch(e.toLowerCase()){case"airplay":a="./img/sources/airplay.png";break;case"cast":a="./img/sources/chromecast.png";break;case"radio-network":a="./img/sources/radio.png";break;case"spotify":a="./img/sources/spotify.png"}switch(t.toLowerCase()){case"deezer":case"deezer2":a="./img/sources/deezer.png";break;case"iheartradio":a="./img/sources/iheart.png";break;case"newtunein":a="./img/sources/newtunein.png";break;case"prime":a="./img/sources/amazon-music.png";break;case"qobuz":a="./img/sources/qobuz.png";break;case"tidal":a="./img/sources/tidal.png";break;case"upnpserver":a="./img/sources/dlna.png";break;case"vtuner":a="./img/sources/vtuner.png"}return a},WNP.getQualityIdent=function(e,t,a,n,i){var r="";switch(a>1e3&&16===n&&44100===i?r="CD":a>7e3&&n>=24&&i>=96e3&&(r="Hi-Res"),e+":"+t){case"2:LOSSLESS":case":LOSSLESS":r="HIGH";break;case"3:HI_RES":r="MQA";break;case"4:HI_RES_LOSSLESS":case":HI_RES_LOSSLESS":case"0:LOSSLESS":r="FLAC";break;case":UHD":r="ULTRA HD";break;case":HD":r="HD";break;case"3:7":case"4:27":r="Hi-Res";break;case"2:6":r="CD"}return r},WNP.Init();
//# sourceMappingURL=index.5aff54ab.js.map