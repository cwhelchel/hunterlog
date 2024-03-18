# Hunterlog User Guide

## Configuration

![Configuration options](img/config.png)

- My Callsign: your callsign. This is what will be logged to your logger
- My Girdsquare: your 6 digit maidenhead gridsquare locator. Used in logging.
- Default TX Power: TX power. this is a holdover from potaplus.

### FLRIG Host IP and Port

The app uses FLRIG to handle CAT control. These two values are the remote 
endpoint of the FLRIG instance that's running. The default FLRIG port is 12345

### Logger types
The radio buttons are for the logger type. Select Default or Log4om to send the basic
ADIF data to a remote logger. Select AClog if you use AcLog as it has to have
the data wrapped in a different command. (Default and Log4om do the same thing currently)

### Remote ADIF Host and port

The remote endpoint data to send logged QSOs. Should be running Log4om or AClog
or any other logger that accepts raw ADIF over UDP connections.

Click save to store the changes. Then click the refresh button on the main 
screen to see your callsign and your configured Gravatar. You have a POTA 
account right?

## Spot Viewer

The lower section of the screen has a table of current POTA spots from the POTA
application page. If you use table mode on the POTA website, then this should be
familiar.

![Spot viewer screenshot](img/spot_viewer.png)

### Filter bar

There are a few filtering options that should be self-explanatory. The region
and Location dropdowns have options that are built from the current spots.

The Hide QRT and Hide Hunted switches can help de-clutter the screen. 

The Clear Filters button will reset the four drop downs to None.

### Spots table

This is the meat of the application. It shows the normal POTA activation spot 
info, a green QSY button that shows the frequency, a clickable spot comment 
section, and the hunted flag.

Clicking anywhere on the row will populate the QSO entry fields at the top of
the application's screen.