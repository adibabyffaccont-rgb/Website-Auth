/**
 * apiClient.js — Link-based API client.
 * All calls authenticated via Discord linked site session (SYSTEM user).
 */
'use strict';

const axios = require('axios');
const tough = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const SITE_URL = (process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, '');

let firebaseApp = null;
let firebaseAuth = null;
function getFirebase() {
  if (firebaseApp) return { app: firebaseApp, auth: firebaseAuth };
  if (process.env.FIREBASE_API_KEY) {
    firebaseApp = initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    });
    firebaseAuth = getAuth(firebaseApp);
    return { app: firebaseApp, auth: firebaseAuth };
  }
  return null;
}

const sessions = new Map();
const SYSTEM_USER = 'SYSTEM';

function createClient(userId) {
  const jar = new tough.CookieJar();
  const client = wrapper(axios.create({
    baseURL: SITE_URL, withCredentials: true, jar, timeout: 15000,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  }));
  sessions.set(userId, { client, jar, email: null, loggedIn: false });
  return client;
}

function getClient(userId) {
  const s = sessions.get(userId);
  return s ? s.client : createClient(userId);
}

async function ensureSystemSession() {
  const s = sessions.get(SYSTEM_USER);
  if (s && s.loggedIn) return true;
  const email = process.env.SITE_EMAIL;
  const password = process.env.SITE_PASSWORD;
  if (!email || !password) return false;
  try {
    const client = createClient(SYSTEM_USER);
    const fb = getFirebase();
    if (fb) {
      const cred = await signInWithEmailAndPassword(fb.auth, email, password);
      const idToken = await cred.user.getIdToken();
      const res = await client.post('/api/auth/firebase-session', { idToken });
      if (res.data.success || res.status === 200) {
        sessions.get(SYSTEM_USER).email = email;
        sessions.get(SYSTEM_USER).loggedIn = true;
        return true;
      }
    } else {
      const res = await client.post('/api/auth/login', { email, password });
      if (res.data.success) {
        sessions.get(SYSTEM_USER).email = email;
        sessions.get(SYSTEM_USER).loggedIn = true;
        return true;
      }
    }
  } catch { }
  return false;
}

// ==================== DISCORD LINK ====================

async function generateVerificationCode(discordUserId) {
  await ensureSystemSession();
  const res = await getClient(SYSTEM_USER).post('/api/discord/generate-code', { discordUserId });
  return res.data;
}

async function getLinkedAccount(discordUserId) {
  await ensureSystemSession();
  try {
    const res = await getClient(SYSTEM_USER).get(`/api/discord/linked/${discordUserId}`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) return { linked: false };
    throw err;
  }
}

async function unlinkAccount(discordUserId) {
  await ensureSystemSession();
  const res = await getClient(SYSTEM_USER).delete(`/api/discord/unlink/${discordUserId}`);
  return res.data;
}

async function requireLinked(discordUserId) {
  const ok = await ensureSystemSession();
  if (!ok) return { ok: false, error: 'Bot session failed. Contact admin.' };
  const link = await getLinkedAccount(discordUserId);
  if (!link.linked) return { ok: false, error: 'Account not linked. Run `/connect` first.' };
  return { ok: true, user: link.user };
}

// ==================== APPLICATIONS ====================
const sys = () => getClient(SYSTEM_USER);

async function getApplications()        { return (await sys().get('/api/applications')).data; }
async function getApplication(id)       { return (await sys().get(`/api/applications/${id}`)).data; }
async function createApplication(data)  { return (await sys().post('/api/applications', data)).data; }
async function deleteApplication(id)    { return (await sys().delete(`/api/applications/${id}`)).data; }
async function getApplicationStats(id)  { return (await sys().get(`/api/applications/${id}/stats`)).data; }
async function updateApplication(id, d) { return (await sys().patch(`/api/applications/${id}`, d)).data; }
async function getDashboardStats()      { return (await sys().get('/api/dashboard/stats')).data; }

// ==================== USERS ====================
async function getAppUsers(appId)              { return (await sys().get(`/api/applications/${appId}/users`)).data; }
async function createAppUser(appId, data)      { return (await sys().post(`/api/applications/${appId}/users`, data)).data; }
async function deleteAppUser(appId, uid)       { return (await sys().delete(`/api/applications/${appId}/users/${uid}`)).data; }
async function banAppUser(appId, uid)          { return (await sys().post(`/api/applications/${appId}/users/${uid}/ban`)).data; }
async function unbanAppUser(appId, uid)        { return (await sys().post(`/api/applications/${appId}/users/${uid}/unban`)).data; }
async function pauseAppUser(appId, uid)        { return (await sys().post(`/api/applications/${appId}/users/${uid}/pause`)).data; }
async function unpauseAppUser(appId, uid)      { return (await sys().post(`/api/applications/${appId}/users/${uid}/unpause`)).data; }
async function resetAppUserHwid(appId, uid)    { return (await sys().post(`/api/applications/${appId}/users/${uid}/reset-hwid`)).data; }
async function updateAppUser(appId, uid, data) { return (await sys().put(`/api/applications/${appId}/users/${uid}`, data)).data; }

// ==================== LICENSES ====================
async function getLicenses(appId)               { return (await sys().get(`/api/applications/${appId}/licenses`)).data; }
async function generateLicense(appId, data)     { return (await sys().post(`/api/applications/${appId}/licenses/generate`, data)).data; }
async function deleteLicense(appId, lid)        { return (await sys().delete(`/api/applications/${appId}/licenses/${lid}`)).data; }
async function extendLicense(appId, lid, days)  { return (await sys().post(`/api/applications/${appId}/licenses/${lid}/extend`, { days })).data; }
async function banLicense(appId, lid)           { return (await sys().post(`/api/applications/${appId}/licenses/${lid}/ban`)).data; }
async function unbanLicense(appId, lid)         { return (await sys().post(`/api/applications/${appId}/licenses/${lid}/unban`)).data; }
async function pauseLicense(appId, lid)         { return (await sys().post(`/api/applications/${appId}/licenses/${lid}/pause`)).data; }
async function resumeLicense(appId, lid)        { return (await sys().post(`/api/applications/${appId}/licenses/${lid}/resume`)).data; }

// ==================== BLACKLIST ====================
async function getBlacklist()              { return (await sys().get('/api/blacklist')).data; }
async function addBlacklist(data)          { return (await sys().post('/api/blacklist', data)).data; }
async function deleteBlacklist(id)         { return (await sys().delete(`/api/blacklist/${id}`)).data; }

// ==================== LOGS ====================
async function getActivityLogs(appId) {
  const url = appId ? `/api/activity-logs?applicationId=${appId}` : '/api/activity-logs';
  return (await sys().get(url)).data;
}
async function getActiveSessions(appId) { return (await sys().get(`/api/applications/${appId}/sessions`)).data; }

// ==================== STATUS ====================
async function checkSiteStatus() {
  try {
    const start = Date.now();
    await axios.get(`${SITE_URL}/api/auth/user`, { timeout: 5000 });
    return { online: true, latency: Date.now() - start };
  } catch (err) {
    return err.response ? { online: true, latency: 0 } : { online: false, error: err.message };
  }
}

module.exports = {
  ensureSystemSession, generateVerificationCode, getLinkedAccount, unlinkAccount, requireLinked,
  getApplications, getApplication, createApplication, deleteApplication, getApplicationStats,
  updateApplication, getDashboardStats,
  getAppUsers, createAppUser, deleteAppUser, banAppUser, unbanAppUser,
  pauseAppUser, unpauseAppUser, resetAppUserHwid, updateAppUser,
  getLicenses, generateLicense, deleteLicense, extendLicense, banLicense, unbanLicense,
  pauseLicense, resumeLicense,
  getBlacklist, addBlacklist, deleteBlacklist,
  getActivityLogs, getActiveSessions, checkSiteStatus,
};
