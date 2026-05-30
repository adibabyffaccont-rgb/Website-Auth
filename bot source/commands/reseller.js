'use strict';

const { SlashCommandBuilder } = require('discord.js');
const api = require('../apiClient');
const { resellerStatsEmbed, errorEmbed, infoEmbed } = require('../embeds');
const guildConfig = require('../lib/guildConfig');
const E = require('../emojis');

async function requireLinkedReseller(interaction) {
  const result = await api.requireLinked(interaction.user.id);
  if (!result.ok) {
    await interaction.editReply({ embeds: [errorEmbed('Not Linked', result.error)] });
    return null;
  }
  // Check reseller role if configured
  const config = await guildConfig.getConfig(interaction.guildId);
  if (config?.resellerRoleId) {
    const member = interaction.member;
    if (!member.roles.cache.has(config.resellerRoleId) && result.user?.role !== 'admin') {
      await interaction.editReply({
        embeds: [errorEmbed('No Access', 'The reseller panel is only available to reseller accounts.')],
      });
      return null;
    }
  }
  return result.user;
}

module.exports = {

  reseller: {
    data: new SlashCommandBuilder()
      .setName('reseller')
      .setDescription('Reseller panel')
      .addSubcommand(sub => sub
        .setName('stats')
        .setDescription('View your reseller statistics'))
      .addSubcommand(sub => sub
        .setName('sales')
        .setDescription('View your recent sales'))
      .addSubcommand(sub => sub
        .setName('users')
        .setDescription('View users under your reseller account')),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });
      const user = await requireLinkedReseller(interaction);
      if (!user) return;

      const sub = interaction.options.getSubcommand();

      const config = await guildConfig.getConfig(interaction.guildId);
      const appId = config?.defaultAppId;

      try {
        if (sub === 'stats') {
          // Fetch stats from dashboard
          const stats = await api.getDashboardStats();
          return interaction.editReply({ embeds: [resellerStatsEmbed(stats, user)] });
        }

        if (!appId) {
          return interaction.editReply({
            embeds: [errorEmbed('No Default App', 'Run `/setup` to configure a default application.')],
          });
        }

        if (sub === 'sales') {
          const licenses = await api.getLicenses(appId);
          const app = await api.getApplication(appId);

          const { EmbedBuilder } = require('discord.js');
          const { COLORS } = require('../embeds');
          const embed = new EmbedBuilder()
            .setColor(COLORS.PURPLE)
            .setTitle(`${E.ACTIVITY} Recent Sales — ${app.name}`)
            .setDescription(`Showing last **${Math.min(licenses.length, 10)}** generated keys`)
            .setTimestamp()
            .setFooter({ text: 'AdiCheats Auth System' });

          const recent = [...licenses].reverse().slice(0, 10);
          recent.forEach((l, i) => {
            const { formatRelativeDate } = require('../embeds');
            embed.addFields({
              name: `${i + 1}. \`${l.licenseKey}\``,
              value: `Users: \`${l.currentUsers}/${l.maxUsers}\` | Created: ${formatRelativeDate(l.createdAt)}`,
              inline: false,
            });
          });

          return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'users') {
          const users = await api.getAppUsers(appId);
          const app = await api.getApplication(appId);

          const { EmbedBuilder } = require('discord.js');
          const { COLORS, userStatus } = require('../embeds');
          const embed = new EmbedBuilder()
            .setColor(COLORS.PURPLE)
            .setTitle(`${E.USER} Reseller Users — ${app.name}`)
            .setDescription(`Total: **${users.length}** users`)
            .setTimestamp()
            .setFooter({ text: 'AdiCheats Auth System' });

          users.slice(0, 15).forEach((u, i) => {
            embed.addFields({
              name: `${i + 1}. ${u.username}`,
              value: `${userStatus(u)} | License: \`${u.licenseKey || 'None'}\``,
              inline: true,
            });
          });

          return interaction.editReply({ embeds: [embed] });
        }
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Reseller Error', err.response?.data?.message || err.message)],
        });
      }
    },
  },
};
