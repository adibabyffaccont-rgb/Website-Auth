'use strict';

const {
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const api = require('../apiClient');
const { successEmbed, errorEmbed, licenseDetailEmbed } = require('../embeds');
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

async function resolveKey(appId, keyOrId) {
  const licenses = await api.getLicenses(appId);
  return licenses.find(l =>
    String(l.id) === keyOrId || l.licenseKey.toLowerCase() === keyOrId.toLowerCase()
  );
}

module.exports = {

  key: {
    data: new SlashCommandBuilder()
      .setName('key')
      .setDescription('License key generation and management')
      .addSubcommand(sub => sub
        .setName('generate')
        .setDescription('Generate a new license key'))
      .addSubcommand(sub => sub
        .setName('info')
        .setDescription('View information about a key')
        .addStringOption(opt => opt.setName('key').setDescription('License key or ID').setRequired(true)))
      .addSubcommand(sub => sub
        .setName('redeem')
        .setDescription('Redeem a license key for a user'))
      .addSubcommand(sub => sub
        .setName('delete')
        .setDescription('Delete a license key')
        .addStringOption(opt => opt.setName('key').setDescription('License key or ID').setRequired(true))),

    async execute(interaction) {
      const sub = interaction.options.getSubcommand();

      // Modals must be shown before any deferral
      if (sub === 'generate') {
        const modal = new ModalBuilder()
          .setCustomId(`key_generate:${interaction.guildId}`)
          .setTitle('Generate License Key');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('days')
              .setLabel('Validity (days)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('30')
              .setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('max_users')
              .setLabel('Max Users')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('1')
              .setRequired(false),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('description')
              .setLabel('Description (optional)')
              .setStyle(TextInputStyle.Short)
              .setRequired(false),
          ),
        );
        return interaction.showModal(modal);
      }

      if (sub === 'redeem') {
        const modal = new ModalBuilder()
          .setCustomId(`key_redeem:${interaction.guildId}`)
          .setTitle('Redeem License Key');

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('key')
              .setLabel('License Key')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('XXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX')
              .setRequired(true),
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('username')
              .setLabel('Username to assign to')
              .setStyle(TextInputStyle.Short)
              .setRequired(true),
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

      const keyOrId = interaction.options.getString('key');

      try {
        if (sub === 'info') {
          const app = await api.getApplication(appId);
          const license = await resolveKey(appId, keyOrId);
          if (!license) {
            return interaction.editReply({
              embeds: [errorEmbed('Not Found', `Key \`${keyOrId}\` not found.`)],
            });
          }

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`lic_delete:${appId}:${license.id}`)
              .setLabel('Delete')
              .setStyle(ButtonStyle.Danger),
          );

          return interaction.editReply({
            embeds: [licenseDetailEmbed(license, app.name)],
            components: [row],
          });
        }

        if (sub === 'delete') {
          const license = await resolveKey(appId, keyOrId);
          if (!license) {
            return interaction.editReply({
              embeds: [errorEmbed('Not Found', `Key \`${keyOrId}\` not found.`)],
            });
          }

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
            embeds: [errorEmbed('Confirm Delete', `Delete key \`${license.licenseKey}\`?`)],
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
