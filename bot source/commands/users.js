'use strict';

const {
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const api = require('../apiClient');
const { successEmbed, errorEmbed, userListEmbed, userDetailEmbed } = require('../embeds');
const notifications = require('../lib/notifications');
const guildConfig = require('../lib/guildConfig');
const E = require('../emojis');

async function requireLinked(interaction) {
  const result = await api.requireLinked(interaction.user.id);
  if (!result.ok) {
    await interaction.editReply({ embeds: [errorEmbed('Not Linked', result.error)] });
    return null;
  }
  return result.user;
}

async function getDefaultAppId(interaction) {
  const config = await guildConfig.getConfig(interaction.guildId);
  return config?.defaultAppId || null;
}

async function resolveUser(appId, username) {
  const users = await api.getAppUsers(appId);
  return users.find(u =>
    u.username.toLowerCase() === username.toLowerCase() || String(u.id) === username
  );
}

module.exports = {

  user: {
    data: new SlashCommandBuilder()
      .setName('user')
      .setDescription('User management')
      .addSubcommand(sub => sub
        .setName('create')
        .setDescription('Create a new user')
        .addStringOption(opt => opt.setName('username').setDescription('Username').setRequired(true))
        .addStringOption(opt => opt.setName('password').setDescription('Password').setRequired(true))
        .addStringOption(opt => opt.setName('expiry').setDescription('Expiry (e.g. 1d, 3 days, 1w, YYYY-MM-DD)')
            .setRequired(false)
            .setAutocomplete(true)))
      .addSubcommand(sub => sub
        .setName('info')
        .setDescription('View user details')
        .addStringOption(opt => opt.setName('username').setDescription('Username or User ID').setRequired(true)))
      .addSubcommand(sub => sub
        .setName('ban')
        .setDescription('Ban a user')
        .addStringOption(opt => opt.setName('username').setDescription('Username or User ID').setRequired(true)))
      .addSubcommand(sub => sub
        .setName('unban')
        .setDescription('Unban a user')
        .addStringOption(opt => opt.setName('username').setDescription('Username or User ID').setRequired(true)))
      .addSubcommand(sub => sub
        .setName('delete')
        .setDescription('Delete a user')
        .addStringOption(opt => opt.setName('username').setDescription('Username or User ID').setRequired(true))),

    async execute(interaction) {
      const sub = interaction.options.getSubcommand();

      // Make sure it's deferred as we removed the modal
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;

      const appId = await getDefaultAppId(interaction);
      if (!appId) {
        return interaction.editReply({
          embeds: [errorEmbed('No Default App', 'Run `/setup` to configure a default application.')],
        });
      }

      if (sub === 'create') {
        const username = interaction.options.getString('username');
        const password = interaction.options.getString('password');
        const expiresRaw = interaction.options.getString('expiry');
        
        // Parse expiry using same logic (we can move parseExpiry to an exported util or just use it if available)
        // Since parseExpiry is in index.js, let's just inline a copy here or require it. 
        // We will inline the parsing logic for simplicity.
        let expiresAt = null;
        if (expiresRaw && expiresRaw.trim() !== '' && expiresRaw.toLowerCase() !== 'lifetime') {
          const str = expiresRaw.toLowerCase().trim();
          const match = str.match(/^(\d+)\s*(d|day|days|w|week|weeks|m|month|months|y|year|years)$/);
          if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            const date = new Date();
            if (unit.startsWith('d')) date.setDate(date.getDate() + value);
            else if (unit.startsWith('w')) date.setDate(date.getDate() + (value * 7));
            else if (unit.startsWith('m')) date.setMonth(date.getMonth() + value);
            else if (unit.startsWith('y')) date.setFullYear(date.getFullYear() + value);
            expiresAt = date.toISOString();
          } else {
            const d = new Date(expiresRaw);
            if (!isNaN(d.getTime())) expiresAt = d.toISOString();
          }
        }

        try {
          const newUser = await api.createAppUser(appId, {
            username, password, expiresAt, isActive: true,
          });
          const app = await api.getApplication(appId);

          const embed = successEmbed('User Created', `**${newUser.username}** added to **${app.name}**.`)
            .addFields(
              { name: 'User ID', value: `\`${newUser.id}\``, inline: true },
              { name: 'Username', value: `\`${newUser.username}\``, inline: true },
              { name: 'Expires', value: expiresAt ? `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:R>` : '\`Never\`', inline: true },
            );

          await notifications.sendNotification(interaction.guildId, 'USER_CREATED', {
            'Username': newUser.username,
            'Created By': interaction.user.tag,
            'App': app.name,
          });

          return interaction.editReply({ embeds: [embed] });
        } catch (err) {
          return interaction.editReply({ embeds: [errorEmbed('Error', err.response?.data?.message || err.message)] });
        }
      }



      const username = interaction.options.getString('username');

      try {
        const app = await api.getApplication(appId);
        const user = await resolveUser(appId, username);

        if (!user) {
          return interaction.editReply({
            embeds: [errorEmbed('User Not Found', `No user \`${username}\` found in **${app.name}**.`)],
          });
        }

        if (sub === 'info') {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`user_ban:${appId}:${user.id}`)
              .setLabel('Ban')
              .setStyle(user.isBanned ? ButtonStyle.Secondary : ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`user_unban:${appId}:${user.id}`)
              .setLabel('Unban')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`user_hwid:${appId}:${user.id}`)
              .setLabel('Reset HWID')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`user_delete:${appId}:${user.id}:${user.username}`)
              .setLabel('Delete')
              .setStyle(ButtonStyle.Danger),
          );
          return interaction.editReply({
            embeds: [userDetailEmbed(user, app.name)],
            components: [row],
          });
        }

        if (sub === 'ban') {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`user_ban_confirm:${appId}:${user.id}:${user.username}`)
              .setLabel('Confirm Ban')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('user_cancel')
              .setLabel('Cancel')
              .setStyle(ButtonStyle.Secondary),
          );
          return interaction.editReply({
            embeds: [errorEmbed('Confirm Ban', `Ban **${user.username}** from **${app.name}**?`)],
            components: [row],
          });
        }

        if (sub === 'unban') {
          await api.unbanAppUser(appId, user.id);
          await notifications.sendNotification(interaction.guildId, 'USER_BANNED', {
            'Action': 'Unbanned',
            'User': user.username,
            'By': interaction.user.tag,
          });
          return interaction.editReply({
            embeds: [successEmbed('User Unbanned', `**${user.username}** has been unbanned from **${app.name}**.`)],
          });
        }

        if (sub === 'delete') {
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`user_delete_confirm:${appId}:${user.id}:${user.username}`)
              .setLabel('Confirm Delete')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('user_cancel')
              .setLabel('Cancel')
              .setStyle(ButtonStyle.Secondary),
          );
          return interaction.editReply({
            embeds: [errorEmbed('Confirm Delete', `Delete **${user.username}** from **${app.name}**? This cannot be undone.`)],
            components: [row],
          });
        }

      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Error', err.response?.data?.message || err.message)],
        });
      }
    },
  },
};
