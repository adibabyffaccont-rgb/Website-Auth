'use strict';

const { SlashCommandBuilder } = require('discord.js');
const api = require('../apiClient');
const { statsEmbed, applicationDetailEmbed, errorEmbed } = require('../embeds');

async function requireLinked(interaction) {
  const result = await api.requireLinked(interaction);
  if (!result.ok) {
    await interaction.editReply({ embeds: [errorEmbed('Not Linked', result.error)] });
    return null;
  }
  return result.user;
}

module.exports = {

  // ===================== /stats =====================
  stats: {
    data: new SlashCommandBuilder()
      .setName('stats')
      .setDescription('View your dashboard statistics'),

    async execute(interaction) {
      await interaction.deferReply();
      if (!await requireLinked(interaction)) return;

      try {
        const s = await api.getDashboardStats();
        return interaction.editReply({ embeds: [statsEmbed(s)] });
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Failed to Fetch Stats', err.response?.data?.message || err.message)],
        });
      }
    },
  },

  // ===================== /application =====================
  application: {
    data: new SlashCommandBuilder()
      .setName('application')
      .setDescription('View stats for a specific application')
      .addIntegerOption(opt =>
        opt.setName('app-id').setDescription('Application ID').setRequired(true)),

    async execute(interaction) {
      await interaction.deferReply();
      if (!await requireLinked(interaction)) return;

      const appId = interaction.options.getInteger('app-id');

      try {
        const [app, stats] = await Promise.all([
          api.getApplication(appId),
          api.getApplicationStats(appId),
        ]);
        return interaction.editReply({ embeds: [applicationDetailEmbed(app, stats)] });
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Failed to Fetch Application', err.response?.data?.message || err.message)],
        });
      }
    },
  },
};
