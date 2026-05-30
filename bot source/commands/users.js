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
        .setDescription('Create a new user'))
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

      if (sub === 'create') {
        const modal = new ModalBuilder()
          .setCustomId(`user_create:${interaction.guildId}`)
          .setTitle('Create User');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('username')
              .setLabel('Username')
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('password')
              .setLabel('Password')
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('expires')
              .setLabel('Expiry (e.g. 1d, 3 days, 1w, 1m, YYYY-MM-DD)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false),
          ),
        );
        return interaction.showModal(modal);
      }

      await interaction.deferReply({ ephemeral: true });
      if (!await requireLinked(interaction)) return;

      const appId = await getDefaultAppId(interaction);
      if (!appId) {
        return interaction.editReply({
          embeds: [errorEmbed('No Default App', 'Run `/setup` to configure a default application.')],
        });
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
