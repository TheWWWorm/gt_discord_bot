# Guardian Tales discord bot
Bot that has a few nice commans for use in GT discord server
## Install

* Dowload and install latest version of node.js from https://nodejs.org/
* After that, navigate to the root of the projects folder and execute the following commands

```
$ npm install
$ npm install -g nodemon
$ npm install -g ts-node
```
* Create a `.env` file in the root of the project, use a `template.env` as example
* Fill in all the missing values in `.env` file

## Use
Execute the following command in the root of the projects folder.
```
$ nodemon index.ts
```
This will run the bot server and will also watch the file system, automatically restarting the server if any changes are made.

## Docker
You can also use Docker to run the app. To do that you stil need to have `.env` localy, as it uses those params to run. Then just simply build the image and run the container.
