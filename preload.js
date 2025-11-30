// Preload script para seguridad
// Este script se ejecuta antes de cargar la página y proporciona
// una capa de seguridad entre el proceso principal y el renderer

const { contextBridge } = require('electron');

// Exponer APIs seguras al renderer process si es necesario
contextBridge.exposeInMainWorld('electron', {
  // Aquí puedes exponer funciones seguras si necesitas
  // comunicación entre Electron y React
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
