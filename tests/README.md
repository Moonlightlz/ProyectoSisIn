# Suite de QA Automation - CalzaSoft 

## Quick Start (5 minutos)

### 1. Instalación Rápida

```bash
cd /path/to/ProyectoSisIn
npm install selenium-webdriver mocha chromedriver --save-dev
```

### 2. Verificar que ChromeDriver está disponible

```bash
npx chromedriver --version
```

Salida esperada: `ChromeDriver X.X.X.X`

### 3. Iniciar la aplicación

En una terminal:
```bash
npm start
```

Esperar hasta que veas: `Compiled successfully` o la app esté en `http://localhost:3000`

### 4. Ejecutar los tests (otra terminal)

```bash
cd /path/to/ProyectoSisIn
npx mocha tests/*.test.js --timeout 30000
```

## Estructuras de Tests

```
tests/
├── GUIA_PRUEBAS.md              # Documentación completa
├── flujo_01_autenticacion.test.js # 3 tests (Login)
├── flujo_02_asistencia.test.js    # 3 tests (Attendance)
├── flujo_03_inventario.test.js    # 3 tests (Inventory)
└── flujo_04_reportes.test.js      # 3 tests (Reports)
```

## Comandos Principales

| Comando | Descripción |
|---------|-------------|
| `npx mocha tests/*.test.js --timeout 30000` | Ejecutar todos los tests |
| `npx mocha tests/flujo_01_*.test.js --timeout 30000` | Ejecutar solo tests de autenticación |
| `npx mocha tests/*.test.js --grep "Login"` | Ejecutar solo tests con "Login" en el nombre |
| `npx mocha tests/*.test.js --reporter json > results.json` | Exportar resultados a JSON |

## Requisitos Previos

- **Node.js** ≥ v14
- **Chrome** navegador instalado
- **Firebase** configurado y online
- **Usuarios de prueba** en la BD:
  - `admin@calzasoft.com` / `Admin@123`
  - `trabajador@calzasoft.com` / `Worker@123`
  - DNI válido en base de datos: `12345678`

## Qué se prueba

### Flujo 1: Autenticación (3 tests)
- ✅ Login exitoso con credenciales válidas
- ✅ Login fallido con credenciales inválidas  
- ✅ Restricción de rutas para usuarios trabajadores

### Flujo 2: Asistencia (3 tests)
- ✅ Marcar entrada con DNI válido
- ✅ Sistema rechaza doble entrada el mismo día
- ✅ Auditoría de ajustes manuales de horas

### Flujo 3: Inventario (3 tests)
- ✅ Crear nuevo material con todos los campos
- ✅ Validación: rechaza submit sin campos obligatorios
- ✅ Integridad de BD: rechaza egreso > stock disponible

### Flujo 4: Reportes (3 tests)
- ✅ Dashboard renderiza correctamente con Chart.js
- ✅ Empty state: sistema no colapsa sin datos
- ✅ Estrés: consulta masiva sin filtros

## Solución de Problemas

### Error: "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Error: "Chrome not found"
```bash
# Reinstalar chromedriver
npm install chromedriver --force
```

### Tests se quedan colgados
- Aumentar timeout: `--timeout 60000`
- Verificar que Firebase está online
- Verificar conectividad de red

### Selectores no encontrados
1. Abre DevTools (F12) en la app
2. Inspecciona el elemento
3. Copia el `id` o `className`
4. Actualiza el test con el nuevo selector

## Archivos de Debug

Si un test falla, se generan screenshots:
- `debug_1.1_login_exitoso.png`
- `debug_2.1_marcar_entrada.png`
- `debug_3.1_nuevo_material.png`
- `debug_4.1_dashboard.png`

Úsalos para identificar exactamente qué falló.

## Interpretación de Resultados

### Éxito
```
✓ passing (12)
✗ failing (0)
```

### Fallo
```
1) Debe redirigir al layout después de login
   Error: Timeout of 30000ms exceeded
```

Revisar el screenshot correspondiente.

## CI/CD Integration

Para GitHub Actions, agregar a `.github/workflows/tests.yml`:

```yaml
name: QA Automation Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm start &
      - run: sleep 5
      - run: npx mocha tests/*.test.js --timeout 30000
```

## Contacto

Para preguntas o reportar bugs en los tests:
- Incluir screenshot (`debug_*.png`)
- Incluir output de consola
- Incluir versión: `node -v`, `npm -v`

---

**Estado:** ✅ Listo para producción  
**Última actualización:** 2026-06-10  
**Casos:** 12 tests funcionales
