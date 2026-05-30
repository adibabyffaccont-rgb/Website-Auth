'use strict';

const {
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle,
} = require('discord.js');
const api = require('../apiClient');
const { connectEmbed, accountEmbed, successEmbed, errorEmbed, infoEmbed, loadingEmbed } = require('../embeds');
const E = require('../emojis');

const SITE_URL = (process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');

// Helper: check if user is linked
async function requireLinked(interaction) {
  const result = await api.requireLinked(interaction.user.id);
  if (!result.ok) {
    await interaction.editReply({
      embeds: [errorEmbed('Not Linked', result.error)],
    });
    return null;
  }
  return result.user;
}

module.exports = {

  // ===================== /connect =====================
  connect: {
    data: new SlashCommandBuilder()
      .setName('connect')
      .setDescription('Link your Discord account to the AdiCheats dashboard'),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      // Check if already linked
      try {
        const existing = await api.getLinkedAccount(interaction.user.id);
        if (existing.linked) {
          const embed = infoEmbed(
            'Already Linked',
            `Your Discord is already linked to **${existing.user?.email || 'a site account'}**.\nUse \`/disconnect\` to unlink first.`,
          );
          return interaction.editReply({ embeds: [embed] });
        }
      } catch { /* not linked, continue */ }

      try {
        const result = await api.generateVerificationCode(interaction.user.id);
        if (!result.success) {
          return interaction.editReply({
            embeds: [errorEmbed('Failed to Generate Code', result.message || 'Please try again.')],
          });
        }

        const embed = connectEmbed(interaction.user.id, result.code, result.expiresAt, SITE_URL);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Open Dashboard')
            .setStyle(ButtonStyle.Link)
            .setURL(`${SITE_URL}/discord-connect`),
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

        // ── Poll for successful link ──────────────────────────────────────────
        // Discord interaction tokens are valid for 15 mins; code expires in 10.
        // We poll every 4 seconds to detect when the user completes linking
        // on the website, then immediately update this ephemeral reply.
        let linked = false;
        const pollInterval = setInterval(async () => {
          try {
            const check = await api.getLinkedAccount(interaction.user.id);
            if (check.linked) {
              linked = true;
              clearInterval(pollInterval);
              clearTimeout(pollTimeout);

              const successEmb = successEmbed(
                'Account Linked!',
                [
                  `${E.HIGH_GREEN_TICK} Your Discord has been linked to **${check.user?.email || 'your site account'}**.`,
                  ``,
                  `You now have **full access** to all bot commands.`,
                  `Use \`/account\` to view your linked profile.`,
                ].join('\n'),
              );

              await interaction.editReply({ embeds: [successEmb], components: [] });
            }
          } catch { /* ignore transient poll errors */ }
        }, 4000);

        // Stop polling after 10 minutes regardless
        const pollTimeout = setTimeout(() => {
          if (!linked) {
            clearInterval(pollInterval);
            // Optionally update the reply to say code expired
            interaction.editReply({
              embeds: [errorEmbed('Code Expired', 'The verification code has expired. Please run `/connect` again.')],
              components: [],
            }).catch(() => {});
          }
        }, 10 * 60 * 1000);

      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Error', err.response?.data?.message || err.message)],
        });
      }
    },
  },

  // ===================== /disconnect =====================
  disconnect: {
    data: new SlashCommandBuilder()
      .setName('disconnect')
      .setDescription('Unlink your Discord account from the AdiCheats dashboard'),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      try {
        const existing = await api.getLinkedAccount(interaction.user.id);
        if (!existing.linked) {
          return interaction.editReply({
            embeds: [errorEmbed('Not Linked', 'Your Discord account is not linked. Run `/connect` to link it.')],
          });
        }

        // Confirmation button
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`disconnect_confirm:${interaction.user.id}`)
            .setLabel('Confirm Disconnect')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`disconnect_cancel:${interaction.user.id}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary),
        );

        const embed = errorEmbed(
          'Confirm Disconnect',
          `Are you sure you want to unlink your Discord from **${existing.user?.email || 'your site account'}**?\n\nYou will lose bot access until you reconnect.`,
        );

        return interaction.editReply({ embeds: [embed], components: [row] });
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Error', err.response?.data?.message || err.message)],
        });
      }
    },
  },

  // ===================== /account =====================
  account: {
    data: new SlashCommandBuilder()
      .setName('account')
      .setDescription('View your linked account information'),

    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      try {
        const link = await api.getLinkedAccount(interaction.user.id);
        if (!link.linked) {
          return interaction.editReply({
            embeds: [errorEmbed('Not Linked', 'Your Discord account is not linked. Run `/connect` to get started.')],
          });
        }

        return interaction.editReply({
          embeds: [accountEmbed(link.user, interaction.user)],
        });
      } catch (err) {
        return interaction.editReply({
          embeds: [errorEmbed('Error', err.response?.data?.message || err.message)],
        });
      }
    },
  },
};
