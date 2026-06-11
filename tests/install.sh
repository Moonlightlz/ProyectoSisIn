#!/bin/bash
# ============================================================================
# Script de Instalación Rápida - Suite QA Automation CalzaSoft
# ============================================================================
# Uso: bash install.sh
# o: chmod +x install.sh && ./install.sh
# ============================================================================

set -e  # Exit on error

echo "=========================================="
echo "🚀 INSTALACIÓN SUITE QA AUTOMATION"
echo "=========================================="
echo ""

# Paso 1: Verificar que está en la raíz del proyecto
if [ ! -f "package.json" ]; then
  echo "❌ Error: No se encontró package.json"
  echo "   Asegúrate de ejecutar este script desde la raíz del proyecto"
  exit 1
fi
echo "✅ package.json encontrado"

# Paso 2: Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Error: Node.js no está instalado"
  echo "   Descarga desde: https://nodejs.org/"
  exit 1
fi
NODE_VERSION=$(node --version)
echo "✅ Node.js instalado: $NODE_VERSION"

# Paso 3: Verificar npm
if ! command -v npm &> /dev/null; then
  echo "❌ Error: npm no está instalado"
  exit 1
fi
NPM_VERSION=$(npm --version)
echo "✅ npm instalado: $NPM_VERSION"

# Paso 4: Instalar dependencias
echo ""
echo "📦 Instalando dependencias de testing..."
npm install --save-dev selenium-webdriver mocha chromedriver

echo ""
echo "✅ selenium-webdriver instalado"
echo "✅ mocha instalado"
echo "✅ chromedriver instalado"

# Paso 5: Verificar ChromeDriver
echo ""
echo "🔍 Verificando ChromeDriver..."
npx chromedriver --version

# Paso 6: Verificar que existen los archivos de test
echo ""
echo "📋 Verificando archivos de tests..."
TEST_FILES=(
  "tests/flujo_01_autenticacion.test.js"
  "tests/flujo_02_asistencia.test.js"
  "tests/flujo_03_inventario.test.js"
  "tests/flujo_04_reportes.test.js"
  "tests/GUIA_PRUEBAS.md"
)

for file in "${TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file NO ENCONTRADO"
  fi
done

# Paso 7: Mostrar próximos pasos
echo ""
echo "=========================================="
echo "✨ INSTALACIÓN COMPLETADA"
echo "=========================================="
echo ""
echo "📚 PRÓXIMOS PASOS:"
echo ""
echo "1. Asegúrate de que la aplicación está en http://localhost:3000"
echo "   Ejecuta en otra terminal:"
echo "   $ npm start"
echo ""
echo "2. Ejecuta los tests:"
echo "   $ npx mocha tests/*.test.js --timeout 30000"
echo ""
echo "3. Para solo autenticación:"
echo "   $ npx mocha tests/flujo_01_autenticacion.test.js --timeout 30000"
echo ""
echo "4. Ver documentación:"
echo "   $ cat tests/GUIA_PRUEBAS.md"
echo ""
echo "=========================================="
echo "✅ ¡Listo para ejecutar tests!"
echo "=========================================="
