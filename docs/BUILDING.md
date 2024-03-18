# Developer Notes

Hunterlog uses [pywebview](https://pywebview.flowrl.com/) to display a single
page web application and this project was started from their 
[pywebview-react-boilerplate](https://github.com/r0x0r/pywebview-react-boilerplate)
project. Note: the parcel bundler version that it calls out had issues with the
map component I wanted to use so this uses a newer parcel version.

The web application frontend is built using React Typescript and the [MUI React](https://mui.com/) component library. It also uses leaflet and react-leaflet for
the mapping component and dayjs for datetime stuff.

The backend, is written in Python and has its dependencies called out in 
`requirements.txt`. The big ones being: marshmallow, marshmallow-sqlalchemy,
SqlAlchemy, adif-io, and alembic. 

Not listed there but worth noting is that this includes python rig CAT control
written for the [Augratin](https://github.com/mbridak/augratin) project with
some minor modifications.

For Linux, the GTK dependencies for pywebview need to be installed. Currently
this is tested on Ubuntu 22.04.4

## Dev Dependencies

Alembic is used to modify and track changes to the sqlite db schema for the main
database. The version is tracked in new databases when created but the developer
has to update the `db.py` script manually with the new Alembic version string.

Flake8 and autopep8 are used in vscode for python linting.

pyinstaller is used to package the source into an executable file.

## Requirements
- Python 3
- Node
- virtualenv

*The last one not so much, as the npm run init has been changed to use python -m venv*

## Installation

``` bash
npm run init
```

This will create a virtual environment, install pip and Node dependencies. Alternatively you can perform these steps manually.

``` bash
npm install
pip install -r requirements.txt
```

On Linux systems installation system makes educated guesses. If you run KDE, QT dependencies are installed, otherwise GTK is chosen. `apt` is used for installing GTK dependencies. In case you are running a non apt-based system, you will have to install GTK dependencies manually. See [installation](https://pywebview.flowrl.com/guide/installation.html) for details.

## Usage

To launch the application.

``` bash
npm run start
```

To build an executable. The output binary will be produced in the `dist` directory.

``` bash
npm run build
```
