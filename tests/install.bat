@echo off
REM ============================================================================
REM Script de Instalación Rápida - Suite QA Automation CalzaSoft (Windows)
REM ============================================================================
REM Uso: install.bat
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo ^[96m^[1m[1m  INSTALACION SUITE QA AUTOMATION^[0m
echo ==========================================
echo.

REM Paso 1: Verificar que está en la raíz del proyecto
if not exist "package.json" (
  echo ^[91m^[1mX^[0m Error: No se encontro package.json
  echo   Asegurate de ejecutar este script desde la raiz del proyecto
  pause
  exit /b 1
)
echo ^[92m^[1m✓^[0m package.json encontrado

REM Paso 2: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo ^[91m^[1mX^[0m Error: Node.js no esta instalado
  echo   Descarga desde: https://nodejs.org/
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ^[92m^[1m✓^[0m Node.js instalado: %NODE_VERSION%

REM Paso 3: Verificar npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo ^[91m^[1mX^[0m Error: npm no esta instalado
  pause
  exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ^[92m^[1m✓^[0m npm instalado: %NPM_VERSION%

REM Paso 4: Instalar dependencias
echo.
echo ^[94m[1m📦^[0m Instalando dependencias de testing...
call npm install --save-dev selenium-webdriver mocha chromedriver

if %errorlevel% neq 0 (
  echo.
  echo ^[91m^[1mX^[0m Error durante la instalacion
  pause
  exit /b 1
)

echo.
echo ^[92m^[1m✓^[0m selenium-webdriver instalado
echo ^[92m^[1m✓^[0m mocha instalado
echo ^[92m^[1m✓^[0m chromedriver instalado

REM Paso 5: Verificar ChromeDriver
echo.
echo ^[94m^[1m🔍^[0m Verificando ChromeDriver...
call npx chromedriver --version

REM Paso 6: Verificar que existen los archivos de test
echo.
echo ^[94m^[1m📋^[0m Verificando archivos de tests...

setlocal
set "test_files[0]=tests\flujo_01_autenticacion.test.js"
set "test_files[1]=tests\flujo_02_asistencia.test.js"
set "test_files[2]=tests\flujo_03_inventario.test.js"
set "test_files[3]=tests\flujo_04_reportes.test.js"
set "test_files[4]=tests\GUIA_PRUEBAS.md"

for /l %%i in (0,1,4) do (
  if exist "!test_files[%%i]!" (
    echo ^[92m^[1m✓^[0m !test_files[%%i]!
  ) else (
    echo ^[91m^[1mX^[0m !test_files[%%i]! NO ENCONTRADO
  )
)
endlocal

REM Paso 7: Mostrar próximos pasos
echo.
echo ==========================================
echo ^[92m^[1m✨ INSTALACION COMPLETADA^[0m
echo ==========================================
echo.
echo ^[94m^[1m📚 PROXIMOS PASOS:^[0m
echo.
echo 1. Asegurate de que la aplicacion esta en http://localhost:3000
echo    Ejecuta en otra terminal:
echo    ^[96m$ npm start^[0m
echo.
echo 2. Ejecuta los tests:
echo    ^[96m$ npx mocha tests/*.test.js --timeout 30000^[0m
echo.
echo 3. Para solo autenticacion:
echo    ^[96m$ npx mocha tests/flujo_01_autenticacion.test.js --timeout 30000^[0m
echo.
echo 4. Ver documentacion:
echo    ^[96m$ type tests\GUIA_PRUEBAS.md^[0m
echo.
echo ==========================================
echo ^[92m^[1m✓ !Listo para ejecutar tests!^[0m
echo ==========================================
echo.
pause
