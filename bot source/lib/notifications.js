/**
 * notifications.js — Discord notification system.
 * Sends automated event embeds to the configured notification channel.
 */

'use strict';

const { EmbedBuilder } = require('discord.js');
const guildConfig = require('./guildConfig');
const E = require('../emojis');

const COLORS = {
  SUCCESS: 0x57F287,
  ERROR: 0xED4245,
  WARNING: 0xFEE75C,
  INFO: 0x00B0F4,
  PURPLE: 0x9C27B0,
  ORANGE: 0xFF7043,
};

// Event definitions: { color, emoji, title }
const EVENT_DEFS = {
  LICENSE_CREATED: {
    color: COLORS.SUCCESS,
    emoji: E.HIGH_GREEN_TICK,
    title: 'License Created',
  },
  KEY_REDEEMED: {
    color: COLORS.INFO,
    emoji: E.KEY,
    title: 'Key Redeemed',
  },
  LICENSE_EXPIRING: {
    color: COLORS.WARNING,
    emoji: E.WARNING,
    title: 'License Expiring Soon',
  },
  LICENSE_EXPIRED: {
    color: COLORS.ERROR,
    emoji: E.CROSS_MAIN,
    title: 'License Expired',
  },
  HWID_RESET: {
    color: COLORS.ORANGE,
    emoji: E.REFRESH_STATIC,
    title: 'HWID Reset',
  },
  USER_BANNED: {
    color: COLORS.ERROR,
    emoji: E.USER_CROSS,
    title: 'User Banned',
  },
  USER_CREATED: {
    color: COLORS.SUCCESS,
    emoji: E.USER,
    title: 'User Created',
  },
};

let _client = null;

/**
 * Must be called once in index.js after client is ready.
 */
function setClient(client) {
  _client = client;
}

/**
 * Send a notification to a guild's configured notification channel.
 * @param {string} guildId
 * @param {string} eventType - One of the EVENT_DEFS keys
 * @param {Object} data - Fields to display: { label: value, ... }
 */
async function sendNotification(guildId, eventType, data = {}) {
  if (!_client) return;

  const notifyChannelId = await guildConfig.get(guildId, 'notifyChannelId');
  if (!notifyChannelId) return;

  const channel = _client.channels.cache.get(notifyChannelId);
  if (!channel || !channel.isTextBased()) return;

  const def = EVENT_DEFS[eventType];
  if (!def) {
    console.warn(`[Notifications] Unknown event type: ${eventType}`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(def.color)
    .setTitle(`${def.emoji} ${def.title}`)
    .setTimestamp()
    .setFooter({ text: 'AdiCheats Auth System' });

  // Add all provided data as fields
  for (const [label, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      embed.addFields({ name: label, value: String(value), inline: true });
    }
  }

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.warn(`[Notifications] Failed to send to channel ${notifyChannelId}: ${err.message}`);
  }
}

/**
 * Log an action to the configured logs channel.
 */
async function sendLog(guildId, message, fields = {}) {
  if (!_client) return;

  const logsChannelId = await guildConfig.get(guildId, 'logsChannelId');
  if (!logsChannelId) return;

  const channel = _client.channels.cache.get(logsChannelId);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle(`${E.INFO} Bot Action Log`)
    .setDescription(message)
    .setTimestamp()
    .setFooter({ text: 'AdiCheats Auth System' });

  for (const [label, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      embed.addFields({ name: label, value: String(value), inline: true });
    }
  }

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.warn(`[Notifications] Failed to send log: ${err.message}`);
  }
}

module.exports = { setClient, sendNotification, sendLog, EVENT_DEFS };
