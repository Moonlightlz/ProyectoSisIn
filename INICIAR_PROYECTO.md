# 🚀 Guía de Inicialización - CalzaSoft

**CalzaSoft** - Sistema de gestión para fábrica de calzado

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 16.x o superior)
  - Descarga desde: https://nodejs.org/
  - Verifica la instalación: `node --version` y `npm --version`

- **Git** (opcional, pero recomendado)
  - Descarga desde: https://git-scm.com/

- **Un editor de código** (VS Code recomendado)
  - Descarga desde: https://code.visualstudio.com/

---

## 📦 Instalación

### 1. Clonar o descargar el proyecto

```bash
# Si usas git
git clone <url-del-repositorio>
cd ProyectoSisIn

# O si descargaste el ZIP, extrae la carpeta y accede a ella
cd ProyectoSisIn
```

### 2. Instalar dependencias

```bash
npm install
```

Este comando instalará todas las dependencias necesarias listadas en `package.json`.

> ⏱️ Esto puede tardar algunos minutos en primera ejecución.

---

## 🔧 Configuración Inicial

### Firebase (Importante)

El proyecto utiliza **Firebase** para autenticación y base de datos. Necesitas configurar tus credenciales:

1. Ve al archivo: `src/firebase.js`
2. Actualiza la configuración con tus credenciales de Firebase:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
```

**¿Cómo obtener estas credenciales?**
- Ve a [Firebase Console](https://console.firebase.google.com/)
- Crea un proyecto nuevo o usa uno existente
- Ve a Configuración del Proyecto → Aplicaciones
- Copia la configuración de la app web

---

## 🎯 Ejecución del Proyecto

### Opción 1: Desarrollo Web (Recomendado para desarrollo)

```bash
npm start
```

- La aplicación se abrirá en `http://localhost:3000`
- Los cambios se reflejan automáticamente (hot reload)
- Abre la consola del navegador para ver logs y errores

**Teclas útiles:**
- `Ctrl + C` para detener el servidor
- `R` en la terminal para recargar
- `W` para ver opciones adicionales

### Opción 2: Desarrollo con Electron (Versión de Escritorio)

```bash
npm run electron-dev
```

- Se abrirá la aplicación en una ventana de Electron
- Incluye herramientas de desarrollo de Electron

### Opción 3: Solo Build para Producción

```bash
npm run build
```

Esto crea una versión optimizada en la carpeta `build/`.

---

## 📁 Estructura del Proyecto

```
ProyectoSisIn/
├── public/                 # Archivos públicos estáticos
├── src/
│   ├── components/        # Componentes React reutilizables
│   ├── contexts/          # Context API para estado global
│   ├── hooks/             # Custom hooks personalizados
│   ├── services/          # Servicios y funciones de negocio
│   ├── types/             # Definiciones de tipos TypeScript
│   ├── utils/             # Funciones utilitarias
│   ├── App.js             # Componente raíz
│   ├── index.js           # Punto de entrada
│   └── firebase.js        # Configuración de Firebase
├── electron.js            # Configuración de Electron
├── preload.js             # Preload script de Electron
├── craco.config.js        # Configuración de Create React App
├── tsconfig.json          # Configuración de TypeScript
└── package.json           # Dependencias del proyecto
```

---

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo (puerto 3000) |
| `npm run build` | Crea build de producción |
| `npm test` | Ejecuta las pruebas unitarias |
| `npm run electron-dev` | Inicia desarrollo con Electron |
| `npm run electron` | Abre la app de Electron (requiere build previo) |
| `npm run electron-pack-win` | Empaqueta la app para Windows |
| `npm run electron-pack-linux` | Empaqueta la app para Linux |
| `npm run dist` | Crea build y empaqueta con Electron |

---

## 🌐 Variables de Entorno (Opcional)

Crea un archivo `.env` en la raíz del proyecto si necesitas variables de entorno:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_KEY=tu_clave_firebase
```

> 📝 **Nota:** Las variables deben comenzar con `REACT_APP_` para ser accesibles en React

---

## 🎨 Tecnologías Principales

- **React 19** - Framework UI
- **TypeScript** - Tipado estático (parcial)
- **Electron** - Aplicación de escritorio
- **Firebase** - Backend y autenticación
- **Tailwind CSS** - Estilos
- **Chart.js** - Gráficos
- **jsPDF** - Generación de PDFs
- **XLSX** - Manejo de Excel

---

## 🐛 Troubleshooting

### ❌ "npm: command not found"
**Solución:** Node.js no está instalado o no está en la ruta del sistema.
- Instala Node.js desde https://nodejs.org/
- Reinicia tu terminal después de la instalación

### ❌ "Error: Cannot find module 'react'"
**Solución:** Las dependencias no están instaladas.
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Puerto 3000 ya está en uso
**Solución:** Usa un puerto diferente
```bash
PORT=3001 npm start
```

### ❌ Problemas con Firebase
**Solución:** 
- Verifica las credenciales en `src/firebase.js`
- Asegúrate de que el proyecto Firebase esté activo
- Revisa las reglas de seguridad en Firebase Console

### ❌ Electron no inicia
**Solución:**
```bash
npm run build
npm run electron
```

### ❌ Node modules corrompido
**Solución:** Limpia e reinstala
```bash
rm -rf node_modules
npm cache clean --force
npm install
```

---

## 📊 Primer Acceso a la Aplicación

1. **Inicia el servidor:** `npm start`
2. **Abre el navegador:** http://localhost:3000
3. **Haz login** con tus credenciales Firebase
4. **¡Comienza a usar CalzaSoft!**

---

## 📚 Recursos Útiles

- [Documentación de React](https://react.dev)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de Electron](https://www.electronjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

---

## 💡 Tips de Desarrollo

1. **Usa React DevTools:** Instala la extensión de React DevTools en Chrome
2. **Electron DevTools:** Presiona `Ctrl+Shift+I` en la app de Electron
3. **Console logs:** Revisa la consola del navegador (F12) para ver logs
4. **Format code:** Usa `Ctrl+Shift+F` en VS Code para formatear

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito cambiar algo después de clonar?**
R: Principalmente la configuración de Firebase en `src/firebase.js`.

**P: ¿Cómo actualizo las dependencias?**
R: `npm update` (con cuidado) o `npm outdated` para ver versiones nuevas.

**P: ¿Dónde añado nuevos componentes?**
R: En la carpeta `src/components/` manteniéndolos organizados.

**P: ¿Cómo creo el build para producción?**
R: `npm run build` y luego `npm run electron-pack-win` para Windows.

---

## ✅ Checklist Inicial

- [ ] Node.js instalado y verificado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Credenciales Firebase configuradas
- [ ] Servidor inicia correctamente (`npm start`)
- [ ] Puedo acceder a http://localhost:3000
- [ ] Puedo hacer login en la aplicación

---

## 📞 Soporte

Para reportar problemas o sugerir mejoras, contacta al equipo de desarrollo.

**¡Bienvenido a CalzaSoft!** 🎉

---

*Última actualización: Abril 2026*
