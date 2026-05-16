# Raspberry Pi requirements for a wiim-now-playing setup

There is a whole range of Raspberry Pi's (and clones) available, new or secondhand. You might have one lying around that's doing nothing.  
So which version should you use? Well, it depends on your use case.

## I want to run wiim-now-playing with a touchscreen, monitor or TV directly attached

In the case you would want to connect a Raspberry Pi directly to a (touch)screen, you'd want a device with enough grunt to run the desktop version of Raspberry Pi OS. **And** enough power to run a Chromium browser locally. For that you'll be looking at a version with at least 1GB of RAM. 2GB of RAM is better, for any overhead. 4GB and higher is overkill, unless you would want to do anything else with the Raspberry Pi on top of running the wiim-now-playing app.

Any Raspberry Pi 3, 4 and 5 will do. Keep in mind that the Chromium browser will only run on devices with at least 1GB of RAM. A 2GB model or up is fine to work with.

The Raspberry Pi 400 and 500 models, the ones built into a keyboard, should also work fine. (Untested!)

Any Compute Module (CM4 and CM5) with enough RAM also work fine, but keep in mind that you do need to have a board or integrated screen to put them in.

Raspberry Pi 1 and 2 versions could also work, but I find that the software support for those models are waning. You will run into some incompatibilies rather sooner than later, which you will then need to solve yourself. Your mileage may vary!

Any Raspberry Pi Zero will **not** work with a screen attached. Those versions have less than 1GB of onboard memory, which will not let you run a desktop with a browser (comfortably).

## I want to run wiim-now-playing without an attached screen i.e. headless

If no directly attached screen is required i.e. your browser is on another device, then all of the above (with screen) is still applicable.

But a Raspberry Pi Zero 2 W will do fine for this headless setup. In fact if you want to put it to the side somewhere e.g. stick it in a cupboard, tape it to the back of a monitor, etc. this will be the cheapest solution.

Do not go for the original Raspberry Pi Zero as this has the same amount of software support as the Raspberry Pi 1 and 2. You may get it to work, but it will be a hassle and frustrate you to no end.

## What types of (touch)screen work best?

There is no best (touch)screen to advise. Whatever you have laying around or looks great to you, go for it.

The official Raspberry Pi Touch Displays are a good way to start looking. They're officialy supported by Raspberry Pi. Although unfortunately they're upside down when installing them out-of-the-box. Please follow the instructions for installation carefully for both the physical installation and software installation!

Then there's a whole plethora of (touch)screens available from third parties. Before you buy, please read up on the information/instructions from the manufacturer itself. How does it get attached to the Pi? Are there any special drivers required? Are those drivers up-to-date? Does the screen need external power or does it piggy-back off of the Pi itself? Questions, questions, questions...

Obviously don't buy those neat little inch-sized displays for this application. I don't think you will see much on those. And obviously any e-ink screen will not work either, those do look pretty though. Then again if you're a die-hard tinkerer you may frankenstein your own solution with that. I'd be curious to see. :)

If you just add a monitor/screen to the HDMI output of the Raspberry Pi, then there's no requirement. Other than that it can output anything over HDMI off course.

There are even square and ultra-wide screens to be had, also great looking. But please note that the wiim-now-playing app is not optimised for those, so your display may look funky at best. Then again if you are a tinkerer yourself you should be able to come up with some layout changes to make it fit properly. ;)

## What else do I need?

Besides just the Raspberry Pi you would also need some other basic stuff, optionally.

### SD card

An SD card is required to hold the Raspberry Pi OS and the app to be installed on. Nowadays, I believe 16GB is the default minimum in stores. This is more than enough to hold everything. Even that 8GB SD card you found in your drawer will do fine. There's no need for anything larger.

Most shops sell pre-installed SD cards, this is totally not required here. Get yourself the cheapest option from the local grocery/dollarstore? Although, beware of any branded scam SD cards, you know which online shops they're on...

On a side note: From my own experience Raspberry Pi's love(d) to eat through SD cards. I found most died on setups that do a lot of reading and writing to the card itself. The wiim-now-playing app does not write a whole lot of data locally and all of the cards I've used in the past year for this are still alive and well. No worries here.

### Power Supply

Obviously you need to power the Raspberry Pi. Because all of them are powered over USB (micro or Type C) any phone charger you already have should do.

**However!** Raspberry Pi's are sensitive to the quality of power delivered to them. Check the power rating on the charger! If the USB charger isn't of great quality you may find yourself with inexplicable reboots or hangs. The official Raspberry Pi Power Supplies are a no brainer if you need a new one.

### Case

If you like your Pi's naked and touch them chips often, then don't get a case. For the rest of us, just pick one to your liking.  
Obviously if you're going the touchscreen route, make sure that you get the accompanying case as well. Or 3D print one yourself.

### Cables

Other than the USB power cable no other cables are required. If you're going to use a touchscreen, most screens come with the necessary cables. But please check in advance.

That being said, if you need to hook up a monitor, network cable and/or keyboard and mouse. Make sure you get the corresponding cables to the Raspberry Pi as well. Some have micro or mini HDMI connectors. Not to mention full scale USB vs micro-USB.

So if you are going to hook up extra peripherals check the sizes of the connectors on your Raspberry Pi.
