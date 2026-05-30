'use strict';

const { EmbedBuilder } = require('discord.js');
const E = require('./emojis');

const COLORS = {
  PRIMARY: 0x5865F2,
  SUCCESS: 0x57F287,
  ERROR: 0xED4245,
  WARNING: 0xFEE75C,
  INFO: 0x00B0F4,
  NEUTRAL: 0x2B2D31,
  ORANGE: 0xFF7043,
  PURPLE: 0x9C27B0,
};

function baseEmbed(color = COLORS.PRIMARY) {
  return new EmbedBuilder()
    .setColor(color)
    .setFooter({ text: 'AdiCheats Auth System' })
    .setTimestamp();
}

function successEmbed(title, description) {
  return baseEmbed(COLORS.SUCCESS)
    .setTitle(`${E.HIGH_GREEN_TICK} ${title}`)
    .setDescription(description || null);
}

function errorEmbed(title, description) {
  return baseEmbed(COLORS.ERROR)
    .setTitle(`${E.CROSS_MAIN} ${title}`)
    .setDescription(description ? `\`\`\`${description}\`\`\`` : null);
}

function warningEmbed(title, description) {
  return baseEmbed(COLORS.WARNING)
    .setTitle(`${E.WARNING} ${title}`)
    .setDescription(description || null);
}

function infoEmbed(title, description) {
  return baseEmbed(COLORS.INFO)
    .setTitle(`${E.INFO} ${title}`)
    .setDescription(description || null);
}

function loadingEmbed(text) {
  return baseEmbed(COLORS.NEUTRAL)
    .setTitle(`${E.LOADING_DOTS} ${text || 'Loading...'}`)
    .setDescription('Please wait...');
}

function formatDate(dateStr) {
  if (!dateStr) return '`Never`';
  try { return `<t:${Math.floor(new Date(dateStr).getTime() / 1000)}:F>`; } catch { return '`Invalid date`'; }
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return '`Never`';
  try { return `<t:${Math.floor(new Date(dateStr).getTime() / 1000)}:R>`; } catch { return '`Invalid date`'; }
}

function truncate(text, maxLen = 100) {
  if (!text) return '`None`';
  return text.length > maxLen ? text.substring(0, maxLen - 3) + '...' : text;
}

function boolEmoji(val) {
  return val ? `${E.HIGH_GREEN_TICK} Yes` : `${E.CROSS_MAIN} No`;
}

function userStatus(user) {
  if (user.isBanned) return `${E.USER_CROSS} **Banned**`;
  if (user.isPaused) return `${E.WARNING} **Paused**`;
  if (!user.isActive) return `${E.CROSS_MAIN} **Inactive**`;
  return `${E.TICK_PRIME} **Active**`;
}

function licenseStatus(license) {
  if (license.isBanned) return `${E.CROSS_MAIN} **Banned**`;
  if (license.isPaused) return `${E.WARNING} **Paused**`;
  if (!license.isActive) return `${E.CROSS_MAIN} **Inactive**`;
  const exp = license.expiresAt ? new Date(license.expiresAt) : null;
  if (exp && exp < new Date()) return `${E.CROSS_MAIN} **Expired**`;
  return `${E.HIGH_GREEN_TICK} **Active**`;
}

function appStatus(app) {
  return app.isActive
    ? `${E.HIGH_GREEN_TICK} **Online**`
    : `${E.CROSS_MAIN} **Offline**`;
}

// ==================== CONNECT / ACCOUNT ====================

function connectEmbed(discordUserId, code, expiresAt, siteUrl) {
  const expTs = Math.floor(expiresAt / 1000);
  return baseEmbed(COLORS.PRIMARY)
    .setTitle(`${E.SECURITY_SHIELD} Link Your Account`)
    .setDescription([
      `To link your Discord account to the AdiCheats dashboard, complete these steps:`,
      ``,
      `**Step 1** — Copy your verification code below`,
      `**Step 2** — Go to the website and log in`,
      `**Step 3** — Navigate to **Settings → Discord Link**`,
      `**Step 4** — Enter your Discord ID and the code`,
    ].join('\n'))
    .addFields(
      { name: 'Verification Code', value: `\`\`\`${code}\`\`\``, inline: false },
      { name: 'Your Discord ID', value: `\`${discordUserId}\``, inline: true },
      { name: 'Expires', value: `<t:${expTs}:R>`, inline: true },
      { name: 'Website', value: `[Open Dashboard](${siteUrl})`, inline: true },
    );
}

function accountEmbed(user, discordUser) {
  return baseEmbed(COLORS.INFO)
    .setTitle(`${E.USER} Linked Account`)
    .setDescription(`Your Discord is linked to the AdiCheats dashboard.`)
    .addFields(
      { name: 'Name', value: `${user.firstName} ${user.lastName || ''}`.trim() || '`N/A`', inline: true },
      { name: 'Email', value: `\`${user.email}\``, inline: true },
      { name: 'Role', value: `\`${user.role || 'user'}\``, inline: true },
      { name: 'Status', value: user.isActive ? `${E.HIGH_GREEN_TICK} Active` : `${E.CROSS_MAIN} Inactive`, inline: true },
      { name: 'Member Since', value: formatRelativeDate(user.createdAt), inline: true },
      { name: 'Discord Tag', value: `\`${discordUser.tag || discordUser.username}\``, inline: true },
    );
}

// ==================== STATS ====================

function statsEmbed(stats, appName) {
  return baseEmbed(COLORS.PRIMARY)
    .setTitle(`${E.GENERAL} Statistics${appName ? ` — ${appName}` : ''}`)
    .addFields(
      { name: `${E.USER} Total Users`, value: `\`${stats.totalUsers || 0}\``, inline: true },
      { name: `${E.HIGH_GREEN_TICK} Active Users`, value: `\`${stats.activeUsers || 0}\``, inline: true },
      { name: `${E.KEY} Total Licenses`, value: `\`${stats.totalLicenses || 0}\``, inline: true },
      { name: `${E.TICK_PRIME} Active Sessions`, value: `\`${stats.totalActiveSessions || 0}\``, inline: true },
      { name: `${E.ACTIVITY} API Requests`, value: `\`${stats.totalApiRequests || 0}\``, inline: true },
      { name: `${E.INFO} Applications`, value: `\`${stats.totalApplications || 0}\``, inline: true },
    );
}

function dashboardEmbed(stats, email) {
  return baseEmbed(COLORS.PRIMARY)
    .setTitle(`${E.GENERAL} Dashboard Overview`)
    .setDescription(`Logged in as **${email || 'Unknown'}**`)
    .addFields(
      { name: `${E.GENERAL} Applications`, value: `\`${stats.totalApplications || 0}\``, inline: true },
      { name: `${E.HIGH_GREEN_TICK} Active Apps`, value: `\`${stats.activeApplications || 0}\``, inline: true },
      { name: `${E.USER} Total Users`, value: `\`${stats.totalUsers || 0}\``, inline: true },
      { name: `${E.ACTIVITY} Active Sessions`, value: `\`${stats.totalActiveSessions || 0}\``, inline: true },
      { name: `${E.INFO} API Requests`, value: `\`${stats.totalApiRequests || 0}\``, inline: true },
      { name: `${E.SECURITY_SHIELD} Account Type`, value: `\`${stats.accountType || 'Standard'}\``, inline: true },
    );
}

// ==================== STATUS ====================

function statusEmbed(results) {
  const icon = (ok) => ok ? E.HIGH_GREEN_TICK : E.CROSS_MAIN;
  const label = (ok) => ok ? '`Online`' : '`Offline`';

  return baseEmbed(COLORS.INFO)
    .setTitle(`${E.SECURITY_SHIELD} System Status`)
    .addFields(
      { name: 'API', value: `${icon(results.api)} ${label(results.api)}`, inline: true },
      { name: 'Website', value: `${icon(results.website)} ${label(results.website)}`, inline: true },
      { name: 'Bot', value: `${icon(true)} \`Online\``, inline: true },
    );
}

// ==================== APPLICATIONS ====================

function applicationListEmbed(apps) {
  const embed = baseEmbed(COLORS.PRIMARY)
    .setTitle(`${E.GENERAL} Your Applications`)
    .setDescription(`Found **${apps.length}** application${apps.length !== 1 ? 's' : ''}`);

  if (apps.length === 0) {
    return embed.setDescription('> No applications found.');
  }

  apps.slice(0, 25).forEach((app, i) => {
    embed.addFields({
      name: `${i + 1}. ${appStatus(app)} ${app.name}`,
      value: [
        `**ID:** \`${app.id}\``,
        `**Version:** \`${app.version || 'N/A'}\``,
        `**HWID Lock:** ${boolEmoji(app.hwidLockEnabled)}`,
        `**Created:** ${formatRelativeDate(app.createdAt)}`,
      ].join(' • '),
      inline: false,
    });
  });

  return embed;
}

function applicationDetailEmbed(app, stats) {
  const embed = baseEmbed(COLORS.INFO)
    .setTitle(`${E.GENERAL} ${app.name}`)
    .setDescription(app.description ? `> ${app.description}` : '> No description set.')
    .addFields(
      { name: 'App ID', value: `\`${app.id}\``, inline: true },
      { name: 'Status', value: appStatus(app), inline: true },
      { name: 'Version', value: `\`${app.version || 'N/A'}\``, inline: true },
      { name: 'HWID Lock', value: boolEmoji(app.hwidLockEnabled), inline: true },
      { name: 'Created', value: formatDate(app.createdAt), inline: true },
      { name: 'Updated', value: formatRelativeDate(app.updatedAt), inline: true },
    );

  if (stats) {
    embed.addFields(
      { name: '\u200b', value: '**Statistics**', inline: false },
      { name: `${E.USER} Total Users`, value: `\`${stats.totalUsers}\``, inline: true },
      { name: `${E.HIGH_GREEN_TICK} Active Users`, value: `\`${stats.activeUsers}\``, inline: true },
      { name: `${E.ACTIVITY} Active Sessions`, value: `\`${stats.activeSessions}\``, inline: true },
    );
  }

  return embed;
}

// ==================== USERS ====================

function userListEmbed(users, appName) {
  const embed = baseEmbed(COLORS.NEUTRAL)
    .setTitle(`${E.USER} Users — ${appName}`)
    .setDescription(`Found **${users.length}** user${users.length !== 1 ? 's' : ''}`);

  if (users.length === 0) return embed.setDescription('> No users found.');

  users.slice(0, 15).forEach((user, i) => {
    embed.addFields({
      name: `${i + 1}. ${userStatus(user)} ${user.username}`,
      value: [
        `**ID:** \`${user.id}\``,
        `Expires: ${formatRelativeDate(user.expiresAt)}`,
        `Last login: ${formatRelativeDate(user.lastLogin)}`,
      ].join(' • '),
      inline: false,
    });
  });

  if (users.length > 15) {
    embed.addFields({ name: '...', value: `And **${users.length - 15}** more.`, inline: false });
  }
  return embed;
}

function userDetailEmbed(user, appName) {
  return baseEmbed(COLORS.INFO)
    .setTitle(`${E.USER} ${user.username}`)
    .setDescription(`Application: **${appName}**`)
    .addFields(
      { name: 'User ID', value: `\`${user.id}\``, inline: true },
      { name: 'Status', value: userStatus(user), inline: true },
      { name: 'HWID Lock', value: boolEmoji(user.hwidLockEnabled), inline: true },
      { name: 'HWID', value: user.hwid ? `\`${user.hwid}\`` : '`Not set`', inline: true },
      { name: 'IP Address', value: user.ip ? `\`${user.ip}\`` : '`Not set`', inline: true },
      { name: 'License Key', value: user.licenseKey ? `\`${user.licenseKey}\`` : '`None`', inline: true },
      { name: 'Expires', value: formatDate(user.expiresAt), inline: true },
      { name: 'Last Login', value: formatRelativeDate(user.lastLogin), inline: true },
      { name: 'Login Attempts', value: `\`${user.loginAttempts || 0}\``, inline: true },
      { name: 'Created', value: formatDate(user.createdAt), inline: true },
    );
}

// ==================== LICENSES ====================

function licenseListEmbed(licenses, appName) {
  const embed = baseEmbed(COLORS.PURPLE)
    .setTitle(`${E.KEY} Licenses — ${appName}`)
    .setDescription(`Found **${licenses.length}** license key${licenses.length !== 1 ? 's' : ''}`);

  if (licenses.length === 0) return embed.setDescription('> No licenses found.');

  licenses.slice(0, 15).forEach((lic, i) => {
    embed.addFields({
      name: `${i + 1}. ${licenseStatus(lic)} \`${lic.licenseKey}\``,
      value: [
        `**Users:** \`${lic.currentUsers}/${lic.maxUsers}\``,
        `**Days:** \`${lic.validityDays}\``,
        `Expires: ${formatRelativeDate(lic.expiresAt)}`,
      ].join(' • '),
      inline: false,
    });
  });

  if (licenses.length > 15) {
    embed.addFields({ name: '...', value: `And **${licenses.length - 15}** more.`, inline: false });
  }
  return embed;
}

function licenseDetailEmbed(lic, appName) {
  return baseEmbed(COLORS.PURPLE)
    .setTitle(`${E.KEY} License Details`)
    .setDescription(`Application: **${appName}**`)
    .addFields(
      { name: 'Key', value: `\`${lic.licenseKey}\``, inline: false },
      { name: 'License ID', value: `\`${lic.id}\``, inline: true },
      { name: 'Status', value: licenseStatus(lic), inline: true },
      { name: 'Users', value: `\`${lic.currentUsers}/${lic.maxUsers}\``, inline: true },
      { name: 'Validity', value: `\`${lic.validityDays} days\``, inline: true },
      { name: 'Expires', value: formatDate(lic.expiresAt), inline: true },
      { name: 'HWID Lock', value: boolEmoji(lic.hwidLockEnabled), inline: true },
      { name: 'Description', value: lic.description ? truncate(lic.description) : '`None`', inline: false },
      { name: 'Created', value: formatDate(lic.createdAt), inline: true },
    );
}

// ==================== BLACKLIST ====================

function blacklistEmbed(entries) {
  const embed = baseEmbed(COLORS.ERROR)
    .setTitle(`${E.CROSS_MAIN} Blacklist Entries`)
    .setDescription(`Found **${entries.length}** entr${entries.length !== 1 ? 'ies' : 'y'}`);

  if (entries.length === 0) return embed.setDescription('> Blacklist is empty.');

  entries.slice(0, 20).forEach((entry, i) => {
    embed.addFields({
      name: `${i + 1}. [${entry.type.toUpperCase()}] ${entry.value}`,
      value: [
        `**ID:** \`${entry.id}\``,
        entry.reason ? `**Reason:** ${truncate(entry.reason, 80)}` : '',
        `**Added:** ${formatRelativeDate(entry.createdAt)}`,
      ].filter(Boolean).join(' | '),
      inline: false,
    });
  });
  return embed;
}

// ==================== LOGS ====================

function activityLogEmbed(logs, appName) {
  const embed = baseEmbed(COLORS.NEUTRAL)
    .setTitle(`${E.INFO} Activity Logs${appName ? ` — ${appName}` : ''}`)
    .setDescription(`Showing last **${Math.min(logs.length, 15)}** of **${logs.length}** events`);

  logs.slice(0, 15).forEach((log) => {
    const icon = log.success ? E.HIGH_GREEN_TICK : E.CROSS_MAIN;
    embed.addFields({
      name: `${icon} ${log.event}`,
      value: [
        log.errorMessage ? `Error: ${truncate(log.errorMessage, 60)}` : '',
        `IP: \`${log.ipAddress || 'N/A'}\` | ${formatRelativeDate(log.createdAt)}`,
      ].filter(Boolean).join('\n'),
      inline: false,
    });
  });
  return embed;
}

// ==================== SETUP ====================

function setupWelcomeEmbed() {
  return baseEmbed(COLORS.PRIMARY)
    .setTitle(`${E.HAMMER} Server Setup Wizard`)
    .setDescription([
      'Welcome to the AdiCheats bot setup wizard.',
      '',
      'Use the buttons below to configure your server:',
      `${E.GENERAL} **Default Application** — Sets which app commands operate on`,
      `${E.INFO} **Logs Channel** — Where bot action logs are sent`,
      `${E.ACTIVITY} **Notifications Channel** — Where automated alerts appear`,
      `${E.USER} **Reseller Role** — Role that grants reseller panel access`,
    ].join('\n'));
}

function settingsEmbed(config, apps) {
  const appName = apps?.find(a => a.id === config?.defaultAppId)?.name || 'Not set';
  return baseEmbed(COLORS.INFO)
    .setTitle(`${E.GENERAL} Server Settings`)
    .addFields(
      { name: `${E.GENERAL} Default App`, value: config?.defaultAppId ? `**${appName}** (\`${config.defaultAppId}\`)` : '`Not configured`', inline: false },
      { name: `${E.INFO} Logs Channel`, value: config?.logsChannelId ? `<#${config.logsChannelId}>` : '`Not configured`', inline: true },
      { name: `${E.ACTIVITY} Notify Channel`, value: config?.notifyChannelId ? `<#${config.notifyChannelId}>` : '`Not configured`', inline: true },
      { name: `${E.USER} Reseller Role`, value: config?.resellerRoleId ? `<@&${config.resellerRoleId}>` : '`Not configured`', inline: true },
    );
}

// ==================== RESELLER ====================

function resellerStatsEmbed(stats, user) {
  return baseEmbed(COLORS.PURPLE)
    .setTitle(`${E.ACTIVITY} Reseller Panel`)
    .setDescription(`Stats for **${user?.firstName || 'Reseller'}**`)
    .addFields(
      { name: `${E.KEY} Total Sales`, value: `\`${stats.totalSales || 0}\``, inline: true },
      { name: `${E.USER} Total Users`, value: `\`${stats.totalUsers || 0}\``, inline: true },
      { name: `${E.HIGH_GREEN_TICK} Active Keys`, value: `\`${stats.activeKeys || 0}\``, inline: true },
    );
}

// ==================== SEARCH ====================

function searchResultEmbed(type, results) {
  const embed = baseEmbed(COLORS.INFO)
    .setTitle(`${E.INFO} Search Results — ${type}`)
    .setDescription(`Found **${results.length}** result${results.length !== 1 ? 's' : ''}`);

  if (results.length === 0) return embed.setDescription('> No results found.');
  return embed;
}

module.exports = {
  COLORS, baseEmbed, successEmbed, errorEmbed, warningEmbed, infoEmbed, loadingEmbed,
  formatDate, formatRelativeDate, truncate, boolEmoji,
  userStatus, licenseStatus, appStatus,
  connectEmbed, accountEmbed, statsEmbed, dashboardEmbed, statusEmbed,
  applicationListEmbed, applicationDetailEmbed,
  userListEmbed, userDetailEmbed,
  licenseListEmbed, licenseDetailEmbed,
  blacklistEmbed, activityLogEmbed,
  setupWelcomeEmbed, settingsEmbed,
  resellerStatsEmbed, searchResultEmbed,
};
