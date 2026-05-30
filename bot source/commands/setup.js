'use strict';

const {
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder,
  ChannelType, PermissionFlagsBits,
} = require('discord.js');
const api = require('../apiClient');
const guildConfig = require('../lib/guildConfig');
const { setupWelcomeEmbed, settingsEmbed, successEmbed, errorEmbed, infoEmbed } = require('../embeds');
const E = require('../emojis');

async function requireAdmin(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      embeds: [errorEmbed('No Permission', 'Only server administrators can use this command.')],
      ephemeral: true,
    });
    return false;
  }
  return true;
}

module.exports = {

  // ===================== /setup =====================
  setup: {
    data: new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Configure the AdiCheats bot for this server')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      if (!await requireAdmin(interaction)) return;

      const embed = setupWelcomeEmbed();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`setup_app:${interaction.guildId}`)
          .setLabel('Set Default App')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`setup_logs:${interaction.guildId}`)
          .setLabel('Set Logs Channel')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`setup_notify:${interaction.guildId}`)
          .setLabel('Set Notify Channel')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`setup_reseller:${interaction.guildId}`)
          .setLabel('Set Reseller Role')
          .setStyle(ButtonStyle.Secondary),
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    },
  },

  // ===================== /settings =====================
  settings: {
    data: new SlashCommandBuilder()
      .setName('settings')
      .setDescription('View the current bot configuration for this server')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });
      if (!await requireAdmin(interaction)) return;

      try {
        const config = await guildConfig.getConfig(interaction.guildId);
        let apps = [];
        try {
          await api.ensureSystemSession();
          apps = await api.getApplications();
        } catch { /* ignore */ }

        const embed = settingsEmbed(config, apps);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`setup_app:${interaction.guildId}`)
            .setLabel('Change Default App')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`setup_logs:${interaction.guildId}`)
            .setLabel('Change Logs Channel')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`setup_notify:${interaction.guildId}`)
            .setLabel('Change Notify Channel')
            .setStyle(ButtonStyle.Secondary),
        );

        return interaction.editReply({ embeds: [embed], components: [row] });
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Error', err.message)],
        });
      }
    },
  },
};
