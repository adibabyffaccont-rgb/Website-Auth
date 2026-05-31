'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../apiClient');
const { blacklistEmbed, activityLogEmbed, errorEmbed, COLORS } = require('../embeds');
const E = require('../emojis');

async function requireLinked(interaction) {
  const result = await api.requireLinked(interaction);
  if (!result.ok) {
    await interaction.editReply({ embeds: [errorEmbed('Not Linked', result.error)] });
    return null;
  }
  return result.user;
}

module.exports = {

  // ===================== /help =====================
  help: {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show all available commands'),

    async execute(interaction) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle(`${E.INFO} AdiCheats Bot — Commands`)
        .setDescription('Use `/connect` to link your account, then access all management features.')
        .addFields(
          {
            name: `${E.SECURITY_SHIELD} Account`,
            value: '`/connect` — Link Discord to website\n`/disconnect` — Remove link\n`/account` — View linked account',
            inline: false,
          },
          {
            name: `${E.HAMMER} Server Setup`,
            value: '`/setup` — Configure bot for this server\n`/settings` — View server config',
            inline: false,
          },
          {
            name: `${E.GENERAL} Statistics`,
            value: '`/stats` — Dashboard overview\n`/application` — App-specific stats\n`/status` — System status',
            inline: false,
          },
          {
            name: `${E.KEY} License Keys`,
            value: '`/license create` — Generate key\n`/license info` — View key\n`/license extend` — Add days\n`/license delete` — Delete key\n`/license reset-hwid` — Clear HWID',
            inline: false,
          },
          {
            name: `${E.USER} Users`,
            value: '`/user create` — Add user\n`/user info` — View user\n`/user ban` — Ban user\n`/user unban` — Unban user\n`/user delete` — Delete user',
            inline: false,
          },
          {
            name: `${E.INFO} Search`,
            value: '`/search` — Find a user or license key',
            inline: false,
          }
        )
        .setFooter({ text: 'AdiCheats Auth System' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: false });
    },
  },

  // ===================== /blacklist =====================
  blacklist: {
    data: new SlashCommandBuilder()
      .setName('blacklist')
      .setDescription('View all blacklist entries'),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;
      try {
        const entries = await api.getBlacklist();
        return interaction.editReply({ embeds: [blacklistEmbed(entries)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Error', err.response?.data?.message || err.message)] });
      }
    },
  },

  // ===================== /logs =====================
  logs: {
    data: new SlashCommandBuilder()
      .setName('logs')
      .setDescription('View recent activity logs')
      .addIntegerOption(opt =>
        opt.setName('app-id').setDescription('Filter by application ID (optional)').setRequired(false)),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;
      const appId = interaction.options.getInteger('app-id');
      try {
        const [logs, appName] = await Promise.all([
          api.getActivityLogs(appId),
          appId ? api.getApplication(appId).then(a => a.name).catch(() => null) : Promise.resolve(null),
        ]);
        return interaction.editReply({ embeds: [activityLogEmbed(logs, appName)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Error', err.response?.data?.message || err.message)] });
      }
    },
  },
};
