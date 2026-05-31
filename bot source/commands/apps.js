'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const api = require('../apiClient');
const {
  successEmbed, errorEmbed, applicationListEmbed, applicationDetailEmbed, COLORS, formatRelativeDate,
} = require('../embeds');
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

  // ===================== /apps =====================
  apps: {
    data: new SlashCommandBuilder()
      .setName('apps')
      .setDescription('List all your applications'),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;
      try {
        const apps = await api.getApplications();
        return interaction.editReply({ embeds: [applicationListEmbed(apps)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Failed to List Apps', err.response?.data?.message || err.message)] });
      }
    },
  },

  // ===================== /app-info =====================
  'app-info': {
    data: new SlashCommandBuilder()
      .setName('app-info')
      .setDescription('View details of a specific application')
      .addIntegerOption(opt => opt.setName('id').setDescription('Application ID').setRequired(true)),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;
      const appId = interaction.options.getInteger('id');
      try {
        const [app, stats] = await Promise.all([
          api.getApplication(appId),
          api.getApplicationStats(appId).catch(() => null),
        ]);
        return interaction.editReply({ embeds: [applicationDetailEmbed(app, stats)] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Failed to Fetch App', err.response?.data?.message || err.message)] });
      }
    },
  },

  // ===================== /app-create =====================
  'app-create': {
    data: new SlashCommandBuilder()
      .setName('app-create')
      .setDescription('Create a new application')
      .addStringOption(opt => opt.setName('name').setDescription('Application name').setRequired(true))
      .addStringOption(opt => opt.setName('description').setDescription('Description').setRequired(false))
      .addStringOption(opt => opt.setName('version').setDescription('Version (e.g. 1.0.0)').setRequired(false))
      .addBooleanOption(opt => opt.setName('hwid-lock').setDescription('Enable HWID lock').setRequired(false)),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;
      const data = {
        name: interaction.options.getString('name'),
        description: interaction.options.getString('description') || undefined,
        version: interaction.options.getString('version') || undefined,
        hwidLockEnabled: interaction.options.getBoolean('hwid-lock') ?? true,
        isActive: true,
      };
      try {
        const app = await api.createApplication(data);
        const embed = successEmbed('Application Created', `**${app.name}** has been created.`)
          .addFields(
            { name: 'App ID', value: `\`${app.id}\``, inline: true },
            { name: 'API Key', value: `\`${app.apiKey}\``, inline: false },
            { name: 'HWID Lock', value: app.hwidLockEnabled ? `${E.HIGH_GREEN_TICK} Enabled` : `${E.CROSS_MAIN} Disabled`, inline: true },
          );
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Failed to Create App', err.response?.data?.message || err.message)] });
      }
    },
  },

  // ===================== /app-delete =====================
  'app-delete': {
    data: new SlashCommandBuilder()
      .setName('app-delete')
      .setDescription('Delete an application (IRREVERSIBLE)')
      .addIntegerOption(opt => opt.setName('id').setDescription('Application ID').setRequired(true)),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;
      const appId = interaction.options.getInteger('id');
      try {
        const app = await api.getApplication(appId);
        await api.deleteApplication(appId);
        return interaction.editReply({
          embeds: [successEmbed('Application Deleted', `**${app.name}** (ID: \`${appId}\`) has been permanently deleted.`)],
        });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Failed to Delete App', err.response?.data?.message || err.message)] });
      }
    },
  },

  // ===================== /app-toggle =====================
  'app-toggle': {
    data: new SlashCommandBuilder()
      .setName('app-toggle')
      .setDescription('Toggle an application active/inactive')
      .addIntegerOption(opt => opt.setName('id').setDescription('Application ID').setRequired(true))
      .addBooleanOption(opt => opt.setName('active').setDescription('true = online, false = offline').setRequired(true)),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;
      const appId = interaction.options.getInteger('id');
      const isActive = interaction.options.getBoolean('active');
      try {
        await api.updateApplication(appId, { isActive });
        const status = isActive ? `${E.HIGH_GREEN_TICK} Online` : `${E.CROSS_MAIN} Offline`;
        return interaction.editReply({
          embeds: [successEmbed('App Status Updated', `Application \`${appId}\` is now ${status}.`)],
        });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Failed to Update App', err.response?.data?.message || err.message)] });
      }
    },
  },

  // ===================== /app-sessions =====================
  'app-sessions': {
    data: new SlashCommandBuilder()
      .setName('app-sessions')
      .setDescription('View active sessions for an application')
      .addIntegerOption(opt => opt.setName('id').setDescription('Application ID').setRequired(true)),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: false });
      if (!await requireLinked(interaction)) return;
      const appId = interaction.options.getInteger('id');
      try {
        const [app, sessions] = await Promise.all([
          api.getApplication(appId),
          api.getActiveSessions(appId),
        ]);
        const embed = new EmbedBuilder()
          .setColor(COLORS.INFO)
          .setTitle(`${E.ACTIVITY} Active Sessions — ${app.name}`)
          .setDescription(`**${sessions.length}** active session${sessions.length !== 1 ? 's' : ''}`)
          .setFooter({ text: 'AdiCheats Auth System' })
          .setTimestamp();

        if (sessions.length === 0) {
          embed.setDescription('> No active sessions.');
        } else {
          sessions.slice(0, 10).forEach((s, i) => {
            embed.addFields({
              name: `Session ${i + 1}`,
              value: [
                `**IP:** \`${s.ipAddress || 'N/A'}\``,
                `**HWID:** \`${s.hwid || 'N/A'}\``,
                `**Started:** ${formatRelativeDate(s.createdAt)}`,
              ].join(' • '),
              inline: false,
            });
          });
        }
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ embeds: [errorEmbed('Failed to Fetch Sessions', err.response?.data?.message || err.message)] });
      }
    },
  },
};
