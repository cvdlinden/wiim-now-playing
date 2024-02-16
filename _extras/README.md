# Extras

This folder contains some extras. Not required for the server or client.

Before executing the scripts you need to do an ``npm install`` in this folder!

## SSDP discovery

```powershell
node test-ssdp.js
```

This script will test SSDP discovery.

It will try and find all UPnP devices on the current network. Not only MediaRenderers.  
It will output all found devices to a devices.csv file (; separated).

## Device information over UPnP

```powershell
node test-device-desc.js
```

This script will try and find all services and their description of the device.

Replace the client URI with any found URI from discovery. It will then try and find any sensible information about the device.

Output will only be shown in the console/terminal.
