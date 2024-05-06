# Hunterlog

[![GitHub Release](https://img.shields.io/github/v/release/cwhelchel/hunterlog?style=flat-square)](https://github.com/cwhelchel/hunterlog/releases)


*THIS IS NOT YOUR MAIN LOGGING PROGRAM!*

This is a replacement for the excellent [potaplus](https://dwestbrook.net/projects/potaplus/) Chrome browser extension. If you have used that then this application
should be very familiar.

This application allows you to browse the current POTA spots, QSY your rig via
FLRIG, and log them to your logger through a remote ADIF message.

![Demo of the goods](docs/img/demo.gif)

## Community

If you're not comfortable using Github to submit issues and enhancement requests, feel free to join our Discord community server. Hop in and ask questions, share comments, propose new features or get help using Hunterlog.

[Discord Invite Link](https://discord.gg/DfqMVMuMnG)

## Download

Hunterlog is in active development and any feedback is welcome. Here are the download links:

Release page [v0.0.4](https://github.com/cwhelchel/hunterlog/releases/tag/v0.0.4)

[Windows Download](https://github.com/cwhelchel/hunterlog/releases/download/v0.0.4/hunterlog_0.0.4.zip)

[Ubuntu Download](https://github.com/cwhelchel/hunterlog/releases/download/v0.0.4/hunterlog-ubuntu_0.0.4hotfix.zip)


## Usage

On Windows, run the executable in any folder. 

On Linux, you may have to `chmod +x` the executable file and run it via the terminal.

The very first thing you should notice is that the default configuration is for 
N0CALL. You **must** change your callsign and gridsquare. Click the 
`CONFIGURATION` button next to the callsign and input your callsign and your
gridsquare. 


### Configuration

Let's look at the configuration options.

![Configuration options](docs/img/config.png)

*My Callsign* and *My Gridsquare* are your base callsign and home QTH 6 digit Maidenhead gridsquare. Your call should also be what your POTA user
account is registered as. 

#### CAT settings 
First is a drop down selection of CAT interface types. Currently those
are FLRIG or RIGCTLD (hopefully more will be added). Host and Port are the two needed values are the remote endpoint of the CAT control instance that's running. The default FLRIG port is 12345.

The modes strings are for setting specific modes if your rig needs something
besides CW for setting CW mode or something besides USB for FT-x modes.

#### Logger settings

The logger settings includes radio buttons for the logger type. Select **TCP**  to use a TCP socket (a la Logger32) or **UDP** to use a UDP socket (a la Log4OM). These two both send raw ADIF data to the remote endpoint. 

Select **AcLog** if you use N3FJP's AcLog as it has special requirements for the data.

Remote ADIF Host and port:

The remote endpoint data to send logged QSOs. This computer should be running Logger32, Log4om, AClog, or any other logger that accepts raw ADIF over network connections.

#### QTH string

When spotting on the POTA network the RST you put in the QSO entry is added to your spot comment. This string is appended directly after the RST sent with a whitespace before it.

Click save to store the changes. Then click the refresh button on the main 
screen to see your callsign and your configured Gravatar. You have a POTA 
account right?

### Stats

**STATISTICAL DATA SHOWN IN THIS APP IS NOT AUTHORITATIVE** The authoritative data
of record is your data in https://pota.app

👉
**For instructions on importing stats** [See the STAT guide](docs/STATS.md)
👈


If you want to see your some nice stats like the POTAPlus addon, you need to
update your stats using the `STATS` menu. There are three options here: 


![Stat Menu Buttons](docs/img/stats.png)

The most important one is the PARK STATS. You will want that to import that so
you can see what parks you need to hunt. 
**Importing the park stats can take a long time** so go read the STATS guide

### Logging QSOs

Click a spot to load the QSO info into the top portion of the screen. Click green frequency button to QSY with CAT control. Click Log QSO after you've had the contact. The app will update stats and send the QSO data (with any modifications you do to the input) to your main logger. 

*It also will store a copy locally in hunter.adi as well as in the database.* This
is for your convenience.

### Spotting

You can now spot/re-spot activators through Hunterlog. When this is done the 
`RST Sent` and `COMMENT` QSO field are used to build the spot comment. Other
posted spot info also comes from the QSO entry fields: Frequency, Callsign, and Mode.
These will be sent to the POTA website and everyone will be able to see them.

## Files

Running the app will create the `spots.db` which is very important as it will 
contain all your qsos, configuration settings and stats such as parks and 
locations. You should back up this file occasionally and back it up before upgrading
to newer versions of Hunterlog.

The file `index.log` is the application's log file. It is not the same as the 
Javascript console that maybe seen when inspecting the webpage.


## Bug reporting

This app is currently under pre-release. Please report bugs here on Github 
issues. In your report, please include both the app version number and the db
version number. Both are displayed at the very bottom of Hunterlog.


\- Cainan N9FZ
