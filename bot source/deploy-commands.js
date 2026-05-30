require('dotenv').config();

const { REST, Routes } = require('discord.js');

// Load all command modules
const modules = [
  require('./commands/auth'),
  require('./commands/apps'),
  require('./commands/users'),
  require('./commands/licenses'),
  require('./commands/key'),
  require('./commands/setup'),
  require('./commands/stats'),
  require('./commands/search'),
  require('./commands/reseller'),
  require('./commands/status'),
  require('./commands/misc'),
];

const commands = [];
for (const mod of modules) {
  for (const cmd of Object.values(mod)) {
    if (cmd.data) {
      commands.push(cmd.data.toJSON());
    }
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Deploying ${commands.length} application commands...`);
    console.log('   Commands:', commands.map(c => `/${c.name}`).join(', '));

    const guildId = process.env.GUILD_ID;
    const clientId = process.env.CLIENT_ID;

    let data;
    if (guildId) {
      // Fast guild-level registration (instant)
      data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands },
      );
      console.log(`✅ Registered ${data.length} commands to guild ${guildId}`);
    } else {
      // Global registration (up to 1 hour to propagate)
      data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
      );
      console.log(`✅ Registered ${data.length} global commands`);
    }
  } catch (err) {
    console.error('❌ Failed to deploy commands:', err);
  }
})();
