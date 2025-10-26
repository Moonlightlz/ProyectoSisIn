const fs = require('fs');
const admin = require('firebase-admin');
const { config } = require('./config');

let db = null;
const APP_NAME = 'modelo-qa-admin';

function initAdmin() {
  if (db) return db;
  if (!config.serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT no configurado');
  }
  const json = JSON.parse(fs.readFileSync(config.serviceAccountPath, 'utf-8'));
  let app = null;
  try {
    app = admin.app(APP_NAME);
  } catch (_e) {
    app = admin.initializeApp({ credential: admin.credential.cert(json) }, APP_NAME);
  }
  db = app.firestore();
  return db;
}

function getDb() {
  return initAdmin();
}

module.exports = { getDb };
