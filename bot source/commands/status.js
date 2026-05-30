'use strict';

const { SlashCommandBuilder } = require('discord.js');
const api = require('../apiClient');
const { statusEmbed, errorEmbed } = require('../embeds');

module.exports = {

  status: {
    data: new SlashCommandBuilder()
      .setName('status')
      .setDescription('Check the status of all system components'),

    async execute(interaction) {
      await interaction.deferReply();

      try {
        const [siteResult] = await Promise.allSettled([
          api.checkSiteStatus(),
        ]);

        const siteOk = siteResult.status === 'fulfilled' && siteResult.value?.online === true;
        const apiOk = siteOk; // API and website are the same server

        const embed = statusEmbed({ api: apiOk, website: siteOk });

        if (siteResult.status === 'fulfilled' && siteResult.value?.latency > 0) {
          embed.addFields({
            name: 'Latency',
            value: `\`${siteResult.value.latency}ms\``,
            inline: true,
          });
        }

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Status Check Failed', err.message)],
        });
      }
    },
  },
};
