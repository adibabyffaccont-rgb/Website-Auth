'use strict';

const {
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const api = require('../apiClient');
const {
  successEmbed, errorEmbed, licenseListEmbed, licenseDetailEmbed,
} = require('../embeds');
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

async function resolveLicense(appId, keyOrId) {
  const licenses = await api.getLicenses(appId);
  return licenses.find(l =>
    String(l.id) === keyOrId || l.licenseKey.toLowerCase() === keyOrId.toLowerCase()
  );
}

module.exports = {

  // ===================== /license create =====================
  license: {
    data: new SlashCommandBuilder()
      .setName('license')
      .setDescription('License key management')
      .addSubcommand(sub => sub
        .setName('create')
        .setDescription('Generate a new license key'))
      .addSubcommand(sub => sub
        .setName('info')
        .setDescription('View license key details')
        .addStringOption(opt => opt.setName('key').setDescription('License key or ID').setRequired(true)))
      .addSubcommand(sub => sub
        .setName('extend')
        .setDescription('Extend a license key by days')
        .addStringOption(opt => opt.setName('key').setDescription('License key or ID').setRequired(true))
        .addIntegerOption(opt => opt.setName('days').setDescription('Days to add').setRequired(true)))
      .addSubcommand(sub => sub
        .setName('delete')
        .setDescription('Delete a license key')
        .addStringOption(opt => opt.setName('key').setDescription('License key or ID').setRequired(true)))
      .addSubcommand(sub => sub
        .setName('reset-hwid')
        .setDescription('Reset HWID for a license key')
        .addStringOption(opt => opt.setName('key').setDescription('License key or ID').setRequired(true))),

    async execute(interaction) {
      const sub = interaction.options.getSubcommand();

      // /license create — open modal
      if (sub === 'create') {
        const modal = new ModalBuilder()
          .setCustomId(`license_create:${interaction.guildId}`)
          .setTitle('Create License Key');

        const daysInput = new TextInputBuilder()
          .setCustomId('days')
          .setLabel('Validity (days)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. 30')
          .setRequired(true);

        const maxUsersInput = new TextInputBuilder()
          .setCustomId('max_users')
          .setLabel('Max Users')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. 1')
          .setRequired(false);

        const descInput = new TextInputBuilder()
          .setCustomId('description')
          .setLabel('Description (optional)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(daysInput),
          new ActionRowBuilder().addComponents(maxUsersInput),
          new ActionRowBuilder().addComponents(descInput),
        );
        return interaction.showModal(modal);
      }

      await interaction.deferReply({ ephemeral: sub !== 'info' });
      if (!await requireLinked(interaction)) return;

      const appId = await getDefaultAppId(interaction);
      if (!appId) {
        return interaction.editReply({
          embeds: [errorEmbed('No Default App', 'Run `/setup` to configure a default application first.')],
        });
      }

      const keyOrId = interaction.options.getString('key');

      try {
        if (sub === 'info') {
          const app = await api.getApplication(appId);
          const license = await resolveLicense(appId, keyOrId);
          if (!license) {
            return interaction.editReply({
              embeds: [errorEmbed('Not Found', `No license \`${keyOrId}\` found.`)],
            });
          }

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`lic_delete:${appId}:${license.id}`)
              .setLabel('Delete')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`lic_hwid:${appId}:${license.id}`)
              .setLabel('Reset HWID')
              .setStyle(ButtonStyle.Secondary),
          );

          return interaction.editReply({
            embeds: [licenseDetailEmbed(license, app.name)],
            components: [row],
          });
        }

        if (sub === 'extend') {
          const days = interaction.options.getInteger('days');
          const license = await resolveLicense(appId, keyOrId);
          if (!license) return interaction.editReply({ embeds: [errorEmbed('Not Found', `No license \`${keyOrId}\` found.`)] });
          await api.extendLicense(appId, license.id, days);
          await notifications.sendNotification(interaction.guildId, 'LICENSE_EXPIRING', {
            'License Key': `\`${license.licenseKey}\``,
            'Extended By': `${days} days`,
            'By': interaction.user.tag,
          });
          return interaction.editReply({
            embeds: [successEmbed('License Extended', `License \`${license.licenseKey}\` extended by **${days} days**.`)],
          });
        }

        if (sub === 'delete') {
          const license = await resolveLicense(appId, keyOrId);
          if (!license) return interaction.editReply({ embeds: [errorEmbed('Not Found', `No license \`${keyOrId}\` found.`)] });
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`lic_delete_confirm:${appId}:${license.id}:${license.licenseKey}`)
              .setLabel('Confirm Delete')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('lic_cancel')
              .setLabel('Cancel')
              .setStyle(ButtonStyle.Secondary),
          );
          return interaction.editReply({
            embeds: [errorEmbed('Confirm Delete', `Are you sure you want to delete \`${license.licenseKey}\`?`)],
            components: [row],
          });
        }

        if (sub === 'reset-hwid') {
          const license = await resolveLicense(appId, keyOrId);
          if (!license) return interaction.editReply({ embeds: [errorEmbed('Not Found', `No license \`${keyOrId}\` found.`)] });
          await api.updateApplication(appId, license.id, { hwid: null });
          await notifications.sendNotification(interaction.guildId, 'HWID_RESET', {
            'License Key': `\`${license.licenseKey}\``,
            'Reset By': interaction.user.tag,
          });
          return interaction.editReply({
            embeds: [successEmbed('HWID Reset', `HWID for \`${license.licenseKey}\` has been cleared.`)],
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
