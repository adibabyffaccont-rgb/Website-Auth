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

// Build all 4 setup select menus in one message
async function buildSetupComponents(guildId, apps) {
  const rows = [];

  // Row 1: Default Application (StringSelect populated with real apps from API)
  if (apps && apps.length > 0) {
    const appOptions = apps.slice(0, 25).map(a => ({
      label: a.name.substring(0, 100),
      value: String(a.id),
      description: a.description ? a.description.substring(0, 50) : `App ID: ${a.id}`,
    }));
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`setup_app_select:${guildId}`)
        .setPlaceholder('Default Application — select one')
        .addOptions(appOptions),
    ));
  } else {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`setup_app_select:${guildId}`)
        .setPlaceholder('No applications found — create one on the website first')
        .setDisabled(true)
        .addOptions([{ label: 'No apps available', value: 'none' }]),
    ));
  }

  // Row 2: Logs Channel (shows all text channels on the server)
  rows.push(new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`setup_logs_select:${guildId}`)
      .setPlaceholder('Logs Channel — where bot action logs are sent')
      .addChannelTypes(ChannelType.GuildText),
  ));

  // Row 3: Notifications Channel (shows all text channels on the server)
  rows.push(new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId(`setup_notify_select:${guildId}`)
      .setPlaceholder('Notifications Channel — where automated alerts appear')
      .addChannelTypes(ChannelType.GuildText),
  ));

  // Row 4: Reseller Role (shows all roles on the server)
  rows.push(new ActionRowBuilder().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(`setup_reseller_select:${guildId}`)
      .setPlaceholder('Reseller Role — grants reseller panel access'),
  ));

  return rows;
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
      await interaction.deferReply({ ephemeral: true });

      let apps = [];
      try {
        await api.ensureSystemSession();
        apps = await api.getApplications();
      } catch { /* will show disabled dropdown if unavailable */ }

      const embed = setupWelcomeEmbed();
      const rows = await buildSetupComponents(interaction.guildId, apps);

      return interaction.editReply({ embeds: [embed], components: rows });
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
        const rows = await buildSetupComponents(interaction.guildId, apps);

        return interaction.editReply({ embeds: [embed], components: rows });
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Error', err.message)],
        });
      }
    },
  },
};
