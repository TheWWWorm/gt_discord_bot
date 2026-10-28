# Guardian Tales discord bot
Bot that has a few nice commands for use in GT discord server

## Install

* Download and install Node.js 24 (LTS) or newer from https://nodejs.org/
* Navigate to the root of the project folder and install the dependencies
```bash
npm install
```
* Create a `.env` file in the root of the project, use `template.env` as example, and fill in the values
* In the [Discord developer portal](https://discord.com/developers/applications), enable the **Message Content Intent** for the bot (Bot → Privileged Gateway Intents). Prefix commands (`give help` etc.) can't read messages without it

## Use
Development mode, which restarts the bot on every file change:
```bash
npm run dev
```

Production mode:
```bash
npm run build
```
```bash
npm start
```

Other scripts:
* `npm test` - run the tests
* `npm run typecheck` - type check the project

Bot data (guild configs and already posted news) is stored as JSON in `db/bases` (can be changed with `DB_DIR` in `.env`), errors are also written to `errors.log`.

## Docker
You can also use Docker to run the bot. You still need to have a `.env` file locally, as it is passed to the container on start (it is not baked into the image).
```bash
docker compose up -d --build
```
The bot data is kept in the `db/bases` folder on the host.

## PM2 locally
So, you just don't want to mess with Docker and just want to enjoy the features of PM2? No problem. Do
```bash
npm install -g pm2
```
```bash
npm run build
```
```bash
npm run pm2
```
You are done! Process should be running in the background
