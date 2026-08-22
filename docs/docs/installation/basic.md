# Installation
Installing Discord BOT Dashboard is a very simple and easy process

#### ⌚ Installing Requirements
Download the latest version from [Releases](https://github.com/LachlanDev/Discord-BOT-Dashboard-V2/releases), open up the root directory and run the following command.
```bash
npm install
```
</br>

#### 🖥️ Setting up BOT
Rename ``config.default.json`` to ``config.json`` and open up the file, this can be found found in the **config** folder and input the required fields.
```json
{
    "clientID":"BOTclientID",
    "clientSecret":"BOTclientSecret",
    "callbackURL":"http://localhost:1337/auth/discord/callback",
    "Admin":["userAdminID"],
    "token":"BOTtoken",
    "prefix":"-",
    "port":"1337"
}
```

* **``clientID``** - This is the Client ID for your BOT, this can be found in the [Discord Developer Portal](https://discord.com/developers) or in the Discord Client.
* **``clientSecret``** - This is the Client Secret for your BOT, this can be ONLY be found in the [Discord Developer Portal](https://discord.com/developers)
* **``callbackURL``** - Add the exact URL used by ``DISCORD_CALLBACK_URL`` in the Discord Developer Portal. Locally use ``http://localhost:1337/auth/discord/callback``; on Render use ``https://your-service.onrender.com/auth/discord/callback``.

<img src="/assets/images/example_dbp.jpeg">

* **``Admin``** - This is the Client ID of your Discord account used to authenticate in the login process. Multiple admins can be added ``["userAdminID","userAdminID2"]`` 
* **``token``** - This is the Token for your BOT used to login to Discord.
* **``prefix``** - Is what we will use to call for commands.
* **``port``** - Is port that will be used to access the dashboard! Ensure you change the port on your OAuth2 url.
</br>
</br>

Make sure to enable both "Privileged Gateway Intents" on the [**Discord Developer Dashboard**](https://discord.com/developers). This is to fix errors  with "Kick / Ban" Commands!

</br>

#### 📡 Starting the application 
Open up the root directory and run the following command.
```bash
node index.js
```
You should now be able to access the dashboard at <a href="http://localhost:1337">http://localhost:1337</a> or the port you chose to use.
</br>

If you ran into any errors or need any further help feel free to ask in the [Discord Server](https://discord.com/invite/w7B5nKB)
