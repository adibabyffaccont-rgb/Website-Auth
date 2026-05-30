'use strict';

const { SlashCommandBuilder } = require('discord.js');
const api = require('../apiClient');
const { userDetailEmbed, licenseDetailEmbed, errorEmbed, infoEmbed } = require('../embeds');
const guildConfig = require('../lib/guildConfig');

async function requireLinked(interaction) {
  const result = await api.requireLinked(interaction.user.id);
  if (!result.ok) {
    await interaction.editReply({ embeds: [errorEmbed('Not Linked', result.error)] });
    return null;
  }
  return result.user;
}

module.exports = {

  search: {
    data: new SlashCommandBuilder()
      .setName('search')
      .setDescription('Search for users or keys')
      .addSubcommand(sub => sub
        .setName('username')
        .setDescription('Search for a user by username')
        .addStringOption(opt =>
          opt.setName('query').setDescription('Username to search for').setRequired(true)))
      .addSubcommand(sub => sub
        .setName('key')
        .setDescription('Search for a license key')
        .addStringOption(opt =>
          opt.setName('query').setDescription('License key or partial key').setRequired(true))),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;

      const sub = interaction.options.getSubcommand();
      const query = interaction.options.getString('query').toLowerCase();

      const config = await guildConfig.getConfig(interaction.guildId);
      const appId = config?.defaultAppId;

      if (!appId) {
        return interaction.editReply({
          embeds: [errorEmbed('No Default App', 'Run `/setup` to configure a default application.')],
        });
      }

      try {
        if (sub === 'username') {
          const users = await api.getAppUsers(appId);
          const app = await api.getApplication(appId);
          const matches = users.filter(u => u.username.toLowerCase().includes(query));

          if (matches.length === 0) {
            return interaction.editReply({
              embeds: [errorEmbed('No Results', `No users matching \`${query}\` found in **${app.name}**.`)],
            });
          }

          if (matches.length === 1) {
            return interaction.editReply({ embeds: [userDetailEmbed(matches[0], app.name)] });
          }

          // Multiple results — show list
          const { EmbedBuilder } = require('discord.js');
          const { COLORS } = require('../embeds');
          const E = require('../emojis');
          const embed = new EmbedBuilder()
            .setColor(COLORS.INFO)
            .setTitle(`${E.INFO} Search Results — "${query}"`)
            .setDescription(`Found **${matches.length}** users:`)
            .setTimestamp()
            .setFooter({ text: 'AdiCheats Auth System' });

          matches.slice(0, 10).forEach((u, i) => {
            embed.addFields({
              name: `${i + 1}. ${u.username}`,
              value: `ID: \`${u.id}\` | Status: ${u.isBanned ? 'Banned' : u.isPaused ? 'Paused' : 'Active'}`,
              inline: false,
            });
          });

          if (matches.length > 10) {
            embed.addFields({ name: '...', value: `And ${matches.length - 10} more. Refine your query.`, inline: false });
          }

          return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'key') {
          const licenses = await api.getLicenses(appId);
          const app = await api.getApplication(appId);
          const matches = licenses.filter(l =>
            l.licenseKey.toLowerCase().includes(query) || String(l.id) === query
          );

          if (matches.length === 0) {
            return interaction.editReply({
              embeds: [errorEmbed('No Results', `No keys matching \`${query}\` found.`)],
            });
          }

          if (matches.length === 1) {
            return interaction.editReply({ embeds: [licenseDetailEmbed(matches[0], app.name)] });
          }

          const { EmbedBuilder } = require('discord.js');
          const { COLORS } = require('../embeds');
          const E = require('../emojis');
          const embed = new EmbedBuilder()
            .setColor(COLORS.PURPLE)
            .setTitle(`${E.KEY} Search Results — "${query}"`)
            .setDescription(`Found **${matches.length}** keys:`)
            .setTimestamp()
            .setFooter({ text: 'AdiCheats Auth System' });

          matches.slice(0, 10).forEach((l, i) => {
            embed.addFields({
              name: `${i + 1}. \`${l.licenseKey}\``,
              value: `ID: \`${l.id}\` | Users: \`${l.currentUsers}/${l.maxUsers}\``,
              inline: false,
            });
          });

          return interaction.editReply({ embeds: [embed] });
        }
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Search Error', err.response?.data?.message || err.message)],
        });
      }
    },
  },
};
