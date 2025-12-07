const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const express = require('express');

// Detectar si estamos en desarrollo sin dependencia externa
const isDev = !app.isPackaged;

let mainWindow;
let server;

// Crear servidor Express para producción
function startServer() {
  return new Promise((resolve, reject) => {
    const expressApp = express();
    
    // En producción empaquetada, los archivos están en el directorio de resources
    let buildPath;
    if (isDev) {
      buildPath = path.join(__dirname, 'build');
    } else {
      // En el paquete, los archivos de build/** están en resources/app
      buildPath = __dirname;
    }
    
    console.log('Build path:', buildPath);
    console.log('__dirname:', __dirname);
    console.log('app.isPackaged:', app.isPackaged);
    
    // Verificar que index.html existe
    const fs = require('fs');
    const indexPath = path.join(buildPath, 'index.html');
    console.log('Buscando index.html en:', indexPath);
    console.log('Existe index.html:', fs.existsSync(indexPath));
    
    if (!fs.existsSync(indexPath)) {
      // Intentar en la carpeta build
      const altBuildPath = path.join(__dirname, 'build');
      const altIndexPath = path.join(altBuildPath, 'index.html');
      console.log('Intentando ruta alternativa:', altIndexPath);
      console.log('Existe en ruta alternativa:', fs.existsSync(altIndexPath));
      if (fs.existsSync(altIndexPath)) {
        buildPath = altBuildPath;
      }
    }
    
    expressApp.use(express.static(buildPath));
    
    // Servir index.html para cualquier ruta (SPA)
    expressApp.use((req, res) => {
      const indexFile = path.join(buildPath, 'index.html');
      console.log('Sirviendo:', indexFile);
      res.sendFile(indexFile);
    });
    
    server = expressApp.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Servidor local corriendo en puerto ${port} sirviendo desde ${buildPath}`);
      resolve(port);
    });
    
    server.on('error', (err) => {
      console.error('Error al iniciar servidor:', err);
      reject(err);
    });
  });
}

function createWindow() {
  // Obtener el tamaño de la pantalla
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // Usar 80% del tamaño de la pantalla, pero con límites
  const windowWidth = Math.min(Math.max(Math.floor(screenWidth * 0.8), 1024), 1920);
  const windowHeight = Math.min(Math.max(Math.floor(screenHeight * 0.85), 768), 1080);
  
  // Crear la ventana del navegador
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'logo192.png'),
    backgroundColor: '#ffffff',
    show: true, // Mostrar inmediatamente para ver errores
    title: 'CalzaSoft',
    autoHideMenuBar: false // Siempre mostrar el menú
  });

  // Cargar la app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, iniciar servidor local y cargar desde ahí
    console.log('Iniciando servidor en producción...');
    startServer().then((port) => {
      const url = `http://127.0.0.1:${port}`;
      console.log('Cargando URL:', url);
      mainWindow.loadURL(url);
    }).catch((err) => {
      console.error('Error al iniciar servidor:', err);
      // Mostrar ventana con mensaje de error
      mainWindow.loadURL(`data:text/html,<html><body><h1>Error al iniciar la aplicación</h1><pre>${err.message}</pre></body></html>`);
      mainWindow.show();
    });
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    console.log('Ventana lista para mostrar');
    mainWindow.show();
  });

  // Logs para depuración
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Error al cargar:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Contenido cargado exitosamente');
  });

  // Emitido cuando la ventana es cerrada
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (server) {
      server.close();
    }
  });

  // Crear menú personalizado
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Recargar',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Pantalla Completa',
          accelerator: 'F11',
          click: () => {
            const isFullScreen = mainWindow.isFullScreen();
            mainWindow.setFullScreen(!isFullScreen);
            // Asegurar que el menú siempre esté visible
            mainWindow.setMenuBarVisibility(true);
          }
        },
        { type: 'separator' },
        {
          label: 'Herramientas de Desarrollo',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de',
          click: () => {
            require('electron').dialog.showMessageBox({
              type: 'info',
              title: 'Acerca de',
              message: 'Sistema de Gestión de Calzado',
              detail: 'Versión 1.0.0\n\nSistema integral para gestión de producción y ventas de calzado.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.whenReady().then(createWindow);

// Salir cuando todas las ventanas estén cerradas.
app.on('window-all-closed', () => {
  // En macOS es común que las aplicaciones y su barra de menú
  // permanezcan activas hasta que el usuario salga explícitamente con Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // En macOS es común volver a crear una ventana en la app cuando el
  // ícono del dock es clickeado y no hay otras ventanas abiertas.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// En desarrollo, esperar a que el servidor de desarrollo esté listo
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}
