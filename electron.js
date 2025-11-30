const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Detectar si estamos en desarrollo sin dependencia externa
const isDev = !app.isPackaged;

let mainWindow;

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
    show: false,
    title: 'Sistema de Gestión de Calzado',
    autoHideMenuBar: false // Siempre mostrar el menú
  });

  // Cargar la app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Abrir DevTools en desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitido cuando la ventana es cerrada
  mainWindow.on('closed', () => {
    mainWindow = null;
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
