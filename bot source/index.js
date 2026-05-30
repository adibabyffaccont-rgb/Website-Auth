require('dotenv').config();

const {
  Client, GatewayIntentBits, Collection, Events, ActivityType,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
  ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType,
} = require('discord.js');

// ==================== COMMAND MODULES ====================
const authCmds     = require('./commands/auth');
const appCmds      = require('./commands/apps');
const userCmds     = require('./commands/users');
const licenseCmds  = require('./commands/licenses');
const keyCmds      = require('./commands/key');
const setupCmds    = require('./commands/setup');
const statsCmds    = require('./commands/stats');
const searchCmds   = require('./commands/search');
const resellerCmds = require('./commands/reseller');
const statusCmds   = require('./commands/status');
const miscCmds     = require('./commands/misc');

const { errorEmbed, successEmbed, infoEmbed, COLORS } = require('./embeds');
const api         = require('./apiClient');
const guildConfig = require('./lib/guildConfig');
const notifications = require('./lib/notifications');
const E           = require('./emojis');

// Helper to parse expiry date or relative duration
function parseExpiry(input) {
  if (!input || input.trim() === '') return null;
  const str = input.toLowerCase().trim();
  const match = str.match(/^(\d+)\s*(d|day|days|w|week|weeks|m|month|months|y|year|years)$/);
  
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    const date = new Date();
    
    if (unit.startsWith('d')) date.setDate(date.getDate() + value);
    else if (unit.startsWith('w')) date.setDate(date.getDate() + (value * 7));
    else if (unit.startsWith('m')) date.setMonth(date.getMonth() + value);
    else if (unit.startsWith('y')) date.setFullYear(date.getFullYear() + value);
    
    return date.toISOString();
  }
  
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// ==================== VALIDATION ====================
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is not set in .env file.');
  process.exit(1);
}
if (!process.env.SITE_URL) {
  console.warn('⚠️  SITE_URL is not set. Defaulting to http://localhost:5000');
}

// ==================== CLIENT ====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ==================== COMMAND REGISTRY ====================
client.commands = new Collection();

const allModules = [
  authCmds, appCmds, userCmds, licenseCmds, keyCmds,
  setupCmds, statsCmds, searchCmds, resellerCmds, statusCmds, miscCmds,
];

for (const mod of allModules) {
  for (const [name, cmd] of Object.entries(mod)) {
    client.commands.set(name, cmd);
  }
}

console.log(`📚 Loaded ${client.commands.size} commands.`);

// ==================== READY ====================
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`\n✅ AdiCheats Bot is online!`);
  console.log(`   Logged in as: ${readyClient.user.tag}`);
  console.log(`   Client ID:    ${readyClient.user.id}`);
  console.log(`   Site URL:     ${process.env.SITE_URL || 'http://localhost:5000'}`);
  console.log(`   Commands:     ${client.commands.size} loaded\n`);

  readyClient.user.setActivity('AdiCheats Auth System', { type: ActivityType.Watching });

  // Register client with notification system
  notifications.setClient(client);

  // Auto-login system session on startup
  try {
    const ok = await api.ensureSystemSession();
    if (ok) {
      console.log('🔐 System session established successfully.');
    } else {
      console.warn('⚠️  System session not established. Set SITE_EMAIL/SITE_PASSWORD in .env');
    }
  } catch (err) {
    console.warn(`⚠️  System session error: ${err.message}`);
  }
});

// ==================== SLASH COMMAND HANDLER ====================
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`❌ Error in /${interaction.commandName}:`, err);
      const errMsg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
      const embed = errorEmbed('Command Error', errMsg);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      } catch { /* ignore follow-up errors */ }
    }
    return;
  }

  // ==================== AUTOCOMPLETE HANDLER ====================
  if (interaction.isAutocomplete()) {
    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === 'expiry' || focusedOption.name === 'days') {
      const choices = ['1 Day', '3 Days', '7 Days', '30 Days', '1 Month', '1 Year', 'Lifetime'];
      const filtered = choices.filter(choice => choice.toLowerCase().startsWith(focusedOption.value.toLowerCase()));
      await interaction.respond(
        filtered.map(choice => ({ name: choice, value: choice }))
      );
    }
    return;
  }

  // ==================== MODAL HANDLER ====================
  if (interaction.isModalSubmit()) {
    const [action, guildId] = interaction.customId.split(':');
    await interaction.deferReply({ ephemeral: true });

    try {

      // key redeem modal
      if (action === 'key_redeem') {
        const linked = await api.requireLinked(interaction.user.id);
        if (!linked.ok) return interaction.editReply({ embeds: [errorEmbed('Not Linked', linked.error)] });

        const config = await guildConfig.getConfig(interaction.guildId || guildId);
        if (!config?.defaultAppId) return interaction.editReply({ embeds: [errorEmbed('No Default App', 'Run `/setup` first.')] });

        const keyStr = interaction.fields.getTextInputValue('key');
        const username = interaction.fields.getTextInputValue('username');

        // Assign license key to user
        const users = await api.getAppUsers(config.defaultAppId);
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) return interaction.editReply({ embeds: [errorEmbed('User Not Found', `No user named \`${username}\`.`)] });

        await api.updateAppUser(config.defaultAppId, user.id, { licenseKey: keyStr });

        await notifications.sendNotification(interaction.guildId, 'KEY_REDEEMED', {
          'Key': `\`${keyStr}\``,
          'Assigned To': username,
          'By': interaction.user.tag,
        });

        return interaction.editReply({
          embeds: [successEmbed('Key Redeemed', `Key \`${keyStr}\` assigned to **${username}**.`)],
        });
      }

    } catch (err) {
      return interaction.editReply({
        embeds: [errorEmbed('Error', err.response?.data?.message || err.message)],
      });
    }
    return;
  }

  // ==================== BUTTON HANDLER ====================
  if (interaction.isButton()) {
    if (interaction.message.interaction && interaction.user.id !== interaction.message.interaction.user.id) {
      return interaction.reply({ content: 'You are not allowed to interact with this component.', ephemeral: true });
    }

    const parts = interaction.customId.split(':');
    const action = parts[0];

    // --- Disconnect confirm/cancel ---
    if (action === 'disconnect_confirm') {
      await interaction.deferUpdate();
      try {
        await api.unlinkAccount(interaction.user.id);
        return interaction.editReply({
          embeds: [successEmbed('Disconnected', 'Your Discord account has been unlinked from the AdiCheats dashboard.')],
          components: [],
        });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Error', err.message)], components: [] });
      }
    }

    if (action === 'disconnect_cancel' || action === 'lic_cancel' || action === 'user_cancel') {
      await interaction.deferUpdate();
      return interaction.editReply({
        embeds: [infoEmbed('Cancelled', 'Action cancelled.')],
        components: [],
      });
    }

    // --- License delete confirm ---
    if (action === 'lic_delete_confirm') {
      const [, appId, licId, licKey] = parts;
      await interaction.deferUpdate();
      try {
        await api.deleteLicense(parseInt(appId), parseInt(licId));
        return interaction.editReply({
          embeds: [successEmbed('License Deleted', `Key \`${licKey}\` has been deleted.`)],
          components: [],
        });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Error', err.message)], components: [] });
      }
    }

    // --- License delete button (from info) ---
    if (action === 'lic_delete') {
      const [, appId, licId] = parts;
      await interaction.deferUpdate();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`lic_delete_confirm:${appId}:${licId}:key`)
          .setLabel('Confirm Delete')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('lic_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary),
      );
      return interaction.editReply({
        embeds: [errorEmbed('Confirm Delete', 'Delete this license key?')],
        components: [row],
      });
    }

    // --- HWID reset (license) ---
    if (action === 'lic_hwid') {
      const [, appId, licId] = parts;
      await interaction.deferUpdate();
      try {
        const licenses = await api.getLicenses(parseInt(appId));
        const lic = licenses.find(l => String(l.id) === licId);
        await notifications.sendNotification(interaction.guildId, 'HWID_RESET', {
          'License': lic ? `\`${lic.licenseKey}\`` : `ID \`${licId}\``,
          'By': interaction.user.tag,
        });
        return interaction.editReply({
          embeds: [successEmbed('HWID Reset', `HWID for license ID \`${licId}\` has been cleared.`)],
          components: [],
        });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Error', err.message)], components: [] });
      }
    }

    // --- User ban confirm ---
    if (action === 'user_ban_confirm') {
      const [, appId, userId, username] = parts;
      await interaction.deferUpdate();
      try {
        await api.banAppUser(parseInt(appId), parseInt(userId));
        await notifications.sendNotification(interaction.guildId, 'USER_BANNED', {
          'User': username,
          'Action': 'Banned',
          'By': interaction.user.tag,
        });
        return interaction.editReply({
          embeds: [successEmbed('User Banned', `**${username}** has been banned.`)],
          components: [],
        });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Error', err.message)], components: [] });
      }
    }

    // --- User delete confirm ---
    if (action === 'user_delete_confirm') {
      const [, appId, userId, username] = parts;
      await interaction.deferUpdate();
      try {
        await api.deleteAppUser(parseInt(appId), parseInt(userId));
        return interaction.editReply({
          embeds: [successEmbed('User Deleted', `**${username}** has been permanently deleted.`)],
          components: [],
        });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Error', err.message)], components: [] });
      }
    }

    // --- User HWID reset ---
    if (action === 'user_hwid') {
      const [, appId, userId] = parts;
      await interaction.deferUpdate();
      try {
        await api.resetAppUserHwid(parseInt(appId), parseInt(userId));
        await notifications.sendNotification(interaction.guildId, 'HWID_RESET', {
          'User ID': userId,
          'By': interaction.user.tag,
        });
        return interaction.editReply({
          embeds: [successEmbed('HWID Reset', `HWID for user ID \`${userId}\` has been cleared.`)],
          components: [],
        });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Error', err.message)], components: [] });
      }
    }

    // --- Confirm Setup button ---
    if (action === 'setup_confirm') {
      await interaction.deferUpdate();
      return interaction.editReply({
        embeds: [successEmbed('Setup Complete', 'All server configurations have been saved successfully.')],
        components: [],
      });
    }

    return;
  }


  // ==================== SELECT MENU HANDLER ====================
  if (interaction.isStringSelectMenu() || interaction.isChannelSelectMenu() || interaction.isRoleSelectMenu()) {
    if (interaction.message.interaction && interaction.user.id !== interaction.message.interaction.user.id) {
      return interaction.reply({ content: 'You are not allowed to interact with this component.', ephemeral: true });
    }

    const [action, guildIdFromMenu] = interaction.customId.split(':');

    if (action === 'setup_app_select') {
      await interaction.deferUpdate();
      const appId = parseInt(interaction.values[0]);
      await guildConfig.setConfig(interaction.guildId || guildIdFromMenu, { defaultAppId: appId });
      return;
    }

    if (action === 'setup_logs_select') {
      await interaction.deferUpdate();
      const channelId = interaction.values[0];
      await guildConfig.setConfig(interaction.guildId || guildIdFromMenu, { logsChannelId: channelId });
      return;
    }

    if (action === 'setup_notify_select') {
      await interaction.deferUpdate();
      const channelId = interaction.values[0];
      await guildConfig.setConfig(interaction.guildId || guildIdFromMenu, { notifyChannelId: channelId });
      return;
    }

    if (action === 'setup_reseller_select') {
      await interaction.deferUpdate();
      const roleId = interaction.values[0];
      await guildConfig.setConfig(interaction.guildId || guildIdFromMenu, { resellerRoleId: roleId });
      return;
    }

    return;
  }
});

// ==================== PREFIX HELP COMMAND ====================
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() === '!help') {
    const { EmbedBuilder } = require('discord.js');
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`${E.INFO} AdiCheats Bot — Quick Reference`)
      .setDescription('This bot uses **Slash Commands**. Type `/` to see all commands.\n\nRun `/connect` to get started.')
      .setFooter({ text: 'AdiCheats Auth System' })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  }
});

// ==================== ERROR HANDLERS ====================
client.on(Events.Error, (err) => console.error('Discord client error:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));
process.on('uncaughtException', (err) => console.error('Uncaught exception:', err));

// ==================== LOGIN ====================
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('❌ Failed to login to Discord:', err.message);
  process.exit(1);
});
