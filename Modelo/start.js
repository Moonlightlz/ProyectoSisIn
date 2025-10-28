#!/usr/bin/env node

/**
 * 🚀 Iniciador del Servidor Q&A
 * 
 * Este script inicia el servidor de preguntas y respuestas de manera estable.
 * 
 * Uso:
 *   node start.js
 * 
 * El servidor se ejecutará en http://localhost:3030
 */

console.log('🚀 Iniciando Servidor de Q&A...');

const path = require('path');
const fs = require('fs');

// Cambiar al directorio del script
const scriptDir = __dirname;
process.chdir(scriptDir);

console.log('📂 Directorio de trabajo:', process.cwd());

// Verificar que estamos en el directorio correcto
if (!fs.existsSync('./src/server.js')) {
  console.error('❌ Error: No se encuentra src/server.js en', process.cwd());
  process.exit(1);
}

// Verificar que las dependencias estén instaladas
if (!fs.existsSync('./node_modules')) {
  console.error('❌ Error: Dependencias no instaladas');
  console.error('💡 Ejecuta: npm install');
  process.exit(1);
}

// Verificar que el archivo .env exista
if (!fs.existsSync('./.env')) {
  console.error('❌ Error: Archivo .env no encontrado');
  console.error('💡 Asegúrate de tener configurado el archivo .env');
  process.exit(1);
}

// Manejadores de señales para cierre limpio
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
try {
  console.log('📂 Directorio actual:', process.cwd());
  console.log('⚙️  Cargando configuración...');
  
  require('./src/server.js');
  
  console.log('✅ Servidor iniciado correctamente');
  console.log('🔗 URL: http://localhost:3030');
  console.log('📝 Endpoint: /ask');
  console.log('\n🛑 Presiona Ctrl+C para detener el servidor');
  
} catch (error) {
  console.error('❌ Error al iniciar el servidor:', error.message);
  process.exit(1);
}