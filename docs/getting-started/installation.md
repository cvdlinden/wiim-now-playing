# Installing the WiiM Now Playing app

Steps to run as fast as possible, locally:  

> [!NOTE]
> *Your mileage may vary...*

1. Open a (bash) command prompt, PowerShell or terminal window.

2. Make sure that you have somewhat recent (LTS) versions of [Node.js](https://nodejs.org/) and [Git](https://git-scm.com/) installed.  
   Also see the [General requirements for running the app](requirements.md).

3. Get the required files from the GitHub repo via Git:

   ```shell
   # Navigate to your user folder or use any folder to your liking
   cd ~

   # Clone this repo, this will create a new folder with all files required
   git clone https://github.com/cvdlinden/wiim-now-playing.git

   # Navigate into the wiim-now-playing folder
   cd wiim-now-playing
   ```

   > [!TIP]
   > You can check the contents of the folder with either ```dir``` or ```ls -la``` commands.

4. Prepare for first run by installing the required dependencies:

   ```shell
   npm install
   ```

   > [!CAUTION]
   > Tend to any **errors** that may pop up. You can try and continue, but it is probably best to fix any **errors** beforehand.  
   >
   > However, if you get any warnings about vulnerabilities that prompt you to run 'npm audit fix --force'. **Please don't**, as this **will break functionality**!  
   >
   > Security vulnerabilities will be addressed through app updates. See: [Updating](updating.md)  
   >
   > *Reminder*: Never run this app on a public server, only within the confines of your own home network!

5. You are now ready to run the app.

   ```shell
   # Start the WiiM Now Playing app
   node server/index.js
   ```

6. If Node does not complain you have the WiiM Now Playing app running. Congrats!

   Open the provided URL in the console, most likely: http://localhost:80  

   > [!NOTE]
   > 'localhost' will only work on the machine that you have the app running on.  
   > If you want to open the app in a browser on another machine, mobile device or tv, you will either need the ip address or computername.local and use that in its browser.  
   > The app provides both in the **Settings > About** section!

7. The app will automatically scan for WiiM devices and pick the first one found.  
   Start some tunes through the WiiM Home App and enjoy!

## Troubleshooting

> [!NOTE]
> If the previous command crashes out, your system most probably does not allow running the server on http port 80.  

This could be the case if you already have a webserver running on port 80. Or if your system simply does not allow it.

Either make sure that there is only one webserver running on port 80 and try and/or unblock your local http server in your OS (possibly somewhere in your firewall settings).

Or open up ```server/index.js``` in your favorite text editor and edit the value in the line:

```bash
const port = process.env.PORT || 80;
```

Try changing from port ``80`` to ports ``8000``, ``8080``, ``5000`` or ``3000`` untill it no longer complains. *You do need to restart node everytime you change ports!*

## Undoing the installation

If this isn't what you expected and want to get rid of? Or if you want to start again cleanly?

All you need to do is delete the wiim-now-playing folder.
