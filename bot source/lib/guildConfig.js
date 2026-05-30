/**
 * guildConfig.js — Per-guild configuration store.
 * Persists to the website API and caches in memory.
 */

'use strict';

const axios = require('axios');

const SITE_URL = process.env.SITE_URL || 'http://localhost:5000';

// In-memory cache: guildId -> config
const cache = new Map();

/**
 * Default config shape
 */
const DEFAULT_CONFIG = {
  defaultAppId: null,
  logsChannelId: null,
  notifyChannelId: null,
  resellerRoleId: null,
};

/**
 * Get config for a guild. Tries cache first, then API.
 */
async function getConfig(guildId) {
  if (cache.has(guildId)) return cache.get(guildId);

  try {
    const res = await axios.get(`${SITE_URL}/api/discord/guild-config/${guildId}`, {
      timeout: 5000,
    });
    const config = res.data?.config || { ...DEFAULT_CONFIG };
    cache.set(guildId, config);
    return config;
  } catch {
    const config = { ...DEFAULT_CONFIG };
    cache.set(guildId, config);
    return config;
  }
}

/**
 * Save config for a guild. Updates cache and persists to API.
 */
async function setConfig(guildId, updates) {
  const existing = await getConfig(guildId);
  const merged = { ...existing, ...updates };
  cache.set(guildId, merged);

  try {
    await axios.post(`${SITE_URL}/api/discord/guild-config/${guildId}`, merged, {
      timeout: 5000,
    });
  } catch (err) {
    console.warn(`[GuildConfig] Failed to persist config for ${guildId}: ${err.message}`);
  }

  return merged;
}

/**
 * Get a specific config value.
 */
async function get(guildId, key) {
  const config = await getConfig(guildId);
  return config[key] ?? null;
}

/**
 * Invalidate cache for a guild.
 */
function invalidate(guildId) {
  cache.delete(guildId);
}

module.exports = { getConfig, setConfig, get, invalidate, DEFAULT_CONFIG };
