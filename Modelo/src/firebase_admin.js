const fs = require('fs');
const admin = require('firebase-admin');
const { config } = require('./config');

let db = null;

function initAdmin() {
  if (db) return db;
  if (!config.serviceAccountPath) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT no configurado');
  }
  const json = JSON.parse(fs.readFileSync(config.serviceAccountPath, 'utf-8'));
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(json) });
  }
  db = admin.firestore();
  return db;
}

function getDb() {
  return initAdmin();
}

module.exports = { getDb };
