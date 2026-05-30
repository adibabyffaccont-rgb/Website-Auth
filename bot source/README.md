# AdiCheats Auth Manager — Discord Bot

A fully-featured Discord bot that integrates with your AdiCheats authentication website via its REST API.

---

## 📁 File Structure

```
bot source/
├── index.js              # Main bot entry point
├── apiClient.js          # HTTP client (session-based auth with cookies)
├── embeds.js             # Professional Discord embed builders
├── deploy-commands.js    # Slash command registration script
├── package.json
├── .env                  # Your configuration (fill this in!)
├── .env.example          # Example configuration
└── commands/
    ├── auth.js           # /login, /logout, /status, /dashboard
    ├── apps.js           # /apps, /app-info, /app-create, /app-delete, /app-toggle, /app-sessions
    ├── users.js          # /users, /user-info, /user-add, /user-delete, /user-ban, etc.
    ├── licenses.js       # /licenses, /license-generate, /license-extend, /license-ban, etc.
    └── misc.js           # /blacklist, /blacklist-add, /blacklist-remove, /logs, /help
```

---

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
cd "bot source"
npm install
```

### 2. Configure `.env`
Edit `.env` and fill in:
- `DISCORD_TOKEN` — Your bot token from the [Discord Developer Portal](https://discord.com/developers/applications)
- `CLIENT_ID` — Your bot's application/client ID
- `GUILD_ID` — (Optional) Your server ID for instant command updates during development
- `SITE_URL` — The URL where your AdiCheats site is running (e.g. `http://localhost:5000`)
- `SITE_EMAIL` — The email of the site account the bot should log in as
- `SITE_PASSWORD` — The corresponding password

### 3. Register Slash Commands
```bash
node deploy-commands.js
```

### 4. Start the Bot
```bash
node index.js
```

---

## 🔐 Authentication

The bot authenticates with your site using **session-based auth** via `POST /api/auth/login`.
It stores cookies per Discord user using a `CookieJar`, keeping sessions isolated.

- If `SITE_EMAIL` and `SITE_PASSWORD` are set, the bot auto-logs in on startup.
- Individual Discord users can also use `/login` to link their own site accounts.
- All commands auto-attempt session renewal using the env credentials if no session exists.

---

## 📋 Available Commands

| Command | Description |
|---|---|
| `/login` | Link your site account |
| `/logout` | Unlink your session |
| `/status` | Check login status |
| `/dashboard` | View account statistics |
| `/apps` | List all applications |
| `/app-info <id>` | View application details |
| `/app-create` | Create a new application |
| `/app-delete <id>` | Delete an application |
| `/app-toggle <id> <active>` | Toggle app online/offline |
| `/app-sessions <id>` | View active sessions |
| `/users <app-id>` | List users in an app |
| `/user-info <app-id> <username>` | View user details |
| `/user-add <app-id> <user> <pass>` | Add a user |
| `/user-delete <app-id> <username>` | Delete a user |
| `/user-ban <app-id> <username>` | Ban a user |
| `/user-unban <app-id> <username>` | Unban a user |
| `/user-pause <app-id> <username> <paused>` | Pause/unpause a user |
| `/user-reset-hwid <app-id> <username>` | Reset user's HWID |
| `/user-extend <app-id> <username> <date>` | Set user's expiry date |
| `/user-set-password <app-id> <user> <pass>` | Change user's password |
| `/licenses <app-id>` | List license keys |
| `/license-info <app-id> <key>` | View license details |
| `/license-generate <app-id> <days>` | Generate a license key |
| `/license-delete <app-id> <key>` | Delete a license key |
| `/license-extend <app-id> <key> <days>` | Extend license expiry |
| `/license-ban <app-id> <key>` | Ban a license key |
| `/license-unban <app-id> <key>` | Unban a license key |
| `/license-pause <app-id> <key> <paused>` | Pause/resume a license |
| `/blacklist` | View blacklist entries |
| `/blacklist-add <type> <value>` | Add blacklist entry |
| `/blacklist-remove <id>` | Remove blacklist entry |
| `/logs [app-id]` | View activity logs |
| `/help` | Show all commands |

---

## 💡 Notes

- Commands like `/user-ban` and `/user-delete` require you to be **the owner** of the application.
- Username fields accept either the exact username or the numeric User ID.
- License fields accept either the full license key string or the numeric License ID.
- The bot uses **ephemeral replies** for sensitive commands (login, delete, generate) so only you see them.
