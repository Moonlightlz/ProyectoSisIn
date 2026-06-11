/**
 * Flujo 3: Tests de Inventario
 * ============================
 * 3 Casos de prueba para validar registro de materiales, validaciones y restricciones
 * 
 * Requisitos:
 * - Aplicación corriendo en http://localhost:3000
 * - Usuario admin logeado
 * - Acceso a módulo de inventario/materias primas
 * - Firebase conectado para guardar registros
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

describe('Flujo 3: Inventario', function() {
  let driver;
  const baseUrl = 'http://localhost:3000';
  const adminEmail = 'admin@calzasoft.com';
  const adminPassword = 'Admin@123';

  before(async function() {
    this.timeout(30000);
    driver = await new Builder()
      .forBrowser('chrome')
      .build();
    await driver.manage().setTimeouts({ implicit: 3000 });
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  /**
   * Helper: Hacer login como admin antes de pruebas de inventario
   */
  async function loginAsAdmin() {
    await driver.get(baseUrl);
    console.log('✓ Navegando a login');

    const emailInput = await driver.wait(
      until.elementLocated(By.id('email')),
      10000
    );
    await emailInput.clear();
    await emailInput.sendKeys(adminEmail);
    console.log('✓ Admin email ingresado');

    const passwordInput = await driver.findElement(By.id('password'));
    await passwordInput.clear();
    await passwordInput.sendKeys(adminPassword);
    console.log('✓ Admin password ingresado');

    const loginButton = await driver.findElement(By.css('button.login-button'));
    await loginButton.click();
    console.log('✓ Login clickeado');

    // Esperar redirección
    await driver.wait(
      until.elementLocated(By.css('.app-layout, .dashboard-layout')),
      15000
    );
    console.log('✓ Login exitoso - Dashboard visible');
  }

  // =========================================================================
  // CASO 3.1: Registro de nueva materia prima llenando todos los campos
  // =========================================================================
  describe('3.1 - Nuevo material', function() {
    it('Debe registrar nueva materia prima con todos los campos completos', async function() {
      this.timeout(30000);

      try {
        // Paso 1: Hacer login como admin
        await loginAsAdmin();

        // Paso 2: Navegar a sección de inventario
        // La ruta puede variar: /inventory, /materiales, /raw-materials, etc.
        const inventoryLinks = ['inventory', 'materiales', 'raw-materials', 'inventario'];
        let navigated = false;

        for (let link of inventoryLinks) {
          try {
            await driver.get(baseUrl + '/' + link);
            const element = await driver.wait(
              until.elementLocated(By.css('.inventory-view, [data-testid="inventory"]')),
              5000
            ).catch(() => null);
            if (element) {
              navigated = true;
              console.log(`✓ Navegando a inventario: /${link}`);
              break;
            }
          } catch {
            // Ruta no existe, probar la siguiente
          }
        }

        assert(navigated, 'No se pudo acceder al módulo de inventario');

        // Paso 3: Buscar botón "Nuevo Material" o similar
        const newMaterialButton = await driver.wait(
          until.elementLocated(By.css('button:contains("Nuevo"), [data-action="new-material"], .btn-new')),
          10000
        ).catch(async () => {
          // Alternativa: buscar por icono o clase
          return await driver.findElement(By.css('[title*="Nuevo"], .btn-primary'));
        });
        console.log('✓ Botón de nuevo material localizado');

        await newMaterialButton.click();
        console.log('✓ Botón clickeado');

        // Paso 4: Esperar modal del formulario
        const modalForm = await driver.wait(
          until.elementLocated(By.css('.modal-overlay, [role="dialog"]')),
          10000
        );
        console.log('✓ Modal de formulario visible');

        // Paso 5: Llenar campo de nombre
        const nameInput = await driver.wait(
          until.elementLocated(By.id('name')),
          5000
        );
        await nameInput.clear();
        await nameInput.sendKeys('Cuero Vacuno Premium');
        console.log('✓ Nombre ingresado: Cuero Vacuno Premium');

        // Paso 6: Llenar categoría
        const categoryInput = await driver.findElement(By.id('category'));
        await categoryInput.clear();
        await categoryInput.sendKeys('Cuero Natural');
        console.log('✓ Categoría ingresada: Cuero Natural');

        // Paso 7: Llenar proveedor (opcional)
        const supplierInput = await driver.findElement(By.id('supplier'));
        await supplierInput.clear();
        await supplierInput.sendKeys('Curtidos del Norte');
        console.log('✓ Proveedor ingresado: Curtidos del Norte');

        // Paso 8: Llenar unidad de medida
        const unitInput = await driver.findElement(By.id('unit'));
        await unitInput.clear();
        await unitInput.sendKeys('planchas');
        console.log('✓ Unidad ingresada: planchas');

        // Paso 9: Llenar umbral de stock bajo
        const thresholdInput = await driver.findElement(By.id('lowStockThreshold'));
        await thresholdInput.clear();
        await thresholdInput.sendKeys('15');
        console.log('✓ Umbral de stock ingresado: 15');

        // Paso 10: Llenar costo unitario (opcional)
        const costInput = await driver.findElement(By.id('cost'));
        await costInput.clear();
        await costInput.sendKeys('95.50');
        console.log('✓ Costo unitario ingresado: 95.50');

        // Paso 11: Validar que el botón guardar está HABILITADO
        const saveButton = await driver.findElement(By.css('button.btn-primary, [type="submit"]'));
        const isEnabled = await saveButton.isEnabled();
        assert(isEnabled, 'Botón guardar está deshabilitado');
        console.log('✓ Botón guardar está habilitado');

        // Paso 12: Hacer clic en guardar
        await saveButton.click();
        console.log('✓ Guardar clickeado');

        // Paso 13: Esperar confirmación/cierre del modal
        await driver.wait(
          async () => {
            try {
              const modals = await driver.findElements(By.css('.modal-overlay'));
              return modals.length === 0;
            } catch {
              return false;
            }
          },
          10000
        );
        console.log('✓ Modal cerrado');

        // Paso 14: Validar que el material aparece en la lista
        await driver.wait(
          async () => {
            try {
              const rows = await driver.findElements(By.css('table tbody tr'));
              for (let row of rows) {
                const text = await row.getText();
                if (text.includes('Cuero Vacuno Premium')) {
                  console.log('✓ Material visible en tabla de inventario');
                  return true;
                }
              }
              return false;
            } catch {
              return false;
            }
          },
          10000
        );
        console.log('✓ Material registrado exitosamente');

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_3.1_nuevo_material.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 3.2: Prevención de nulos - Submit sin campos obligatorios
  // =========================================================================
  describe('3.2 - Validación de campos obligatorios', function() {
    it('Debe rechazar submit dejando campos obligatorios vacíos', async function() {
      this.timeout(30000);

      try {
        // Paso 1: Hacer login
        await loginAsAdmin();

        // Paso 2: Navegar a inventario
        await driver.get(baseUrl + '/inventory');
        await driver.wait(
          until.elementLocated(By.css('.inventory-view, [data-testid="inventory"]')),
          10000
        ).catch(() => null); // Puede no existir
        console.log('✓ En sección de inventario');

        // Paso 3: Abrir nuevo material
        const newButton = await driver.findElement(By.css('button:contains("Nuevo"), [data-action="new-material"], .btn-primary'));
        await newButton.click();
        console.log('✓ Abriendo formulario de material');

        // Paso 4: Esperar modal
        const modal = await driver.wait(
          until.elementLocated(By.css('.modal-overlay')),
          10000
        );
        console.log('✓ Modal visible');

        // Paso 5: NO llenar NINGÚN campo (dejarlos vacíos)
        // Solo hacer clic en guardar directamente
        const saveButton = await driver.findElement(By.css('button.btn-primary, [type="submit"]'));
        
        // Paso 6: Verificar que el botón guardar está DESHABILITADO
        const isDisabled = !(await saveButton.isEnabled());
        
        if (isDisabled) {
          console.log('✓ Botón guardar está deshabilitado (validación preventiva)');
          // El sistema previene el envío deshabilitando el botón
          return;
        }

        // Si el botón está habilitado, intentar hacer clic
        await saveButton.click();
        console.log('✓ Intento de envío sin campos');

        // Paso 7: El sistema DEBE mostrar error de validación
        const errorMessage = await driver.wait(
          until.elementLocated(By.css('.error-message, [role="alert"]')),
          10000
        );
        console.log('✓ Mensaje de error aparece');

        // Paso 8: Validar que el error es sobre campos obligatorios
        const errorText = await errorMessage.getText();
        assert(
          errorText.toLowerCase().includes('obligatorio') || 
          errorText.toLowerCase().includes('requerido') ||
          errorText.toLowerCase().includes('vacío'),
          `Error inesperado: ${errorText}`
        );
        console.log(`✓ Error correcto: "${errorText}"`);

        // Paso 9: Validar que el modal sigue abierto (no se guardó)
        const modalStillOpen = await driver.findElement(By.css('.modal-overlay'));
        assert(modalStillOpen, 'Modal se cerró sin guardar');
        console.log('✓ Modal permanece abierto (no se guardó)');

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_3.2_validacion_campos.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 3.3: Integridad de BD - Egreso mayor a stock disponible
  // =========================================================================
  describe('3.3 - Integridad de datos: stock negativo', function() {
    it('Debe rechazar egreso que resultaría en stock negativo', async function() {
      this.timeout(30000);

      try {
        // Paso 1: Hacer login
        await loginAsAdmin();

        // Paso 2: Navegar a inventario
        await driver.get(baseUrl + '/inventory');
        await driver.wait(
          until.elementLocated(By.css('.inventory-view')),
          10000
        ).catch(() => null);
        console.log('✓ En inventario');

        // Paso 3: Seleccionar un material que existe
        // Buscar primera fila de material en la tabla
        const rows = await driver.wait(
          async () => {
            const tableRows = await driver.findElements(By.css('table tbody tr'));
            return tableRows.length > 0 ? tableRows : null;
          },
          10000
        );
        assert(rows.length > 0, 'No hay materiales en tabla');
        console.log('✓ Materiales cargados en tabla');

        // Paso 4: Hacer clic en primera fila para ver detalles
        await rows[0].click();
        console.log('✓ Material seleccionado');

        // Paso 5: Esperar vista de detalle
        const detailView = await driver.wait(
          until.elementLocated(By.css('[data-view="material-detail"], .material-detail')),
          10000
        );
        console.log('✓ Vista de detalle del material abierta');

        // Paso 6: Obtener stock actual del material (parsearlo de la pantalla)
        const stockDisplay = await driver.findElement(By.css('[data-field="stock"], .stock-value'));
        const stockText = await stockDisplay.getText();
        const currentStock = parseInt(stockText.match(/\d+/)[0]);
        console.log(`✓ Stock actual del material: ${currentStock}`);

        // Paso 7: Buscar botón para registrar egreso/salida
        const egressButton = await driver.findElement(By.css('[data-action="egreso"], button:contains("Egreso"), .btn-egreso'));
        await egressButton.click();
        console.log('✓ Modal de egreso abierto');

        // Paso 8: Esperar modal de movimiento
        const movementModal = await driver.wait(
          until.elementLocated(By.css('.modal-overlay, [role="dialog"]')),
          10000
        );
        console.log('✓ Modal de movimiento visible');

        // Paso 9: Intentar ingresar cantidad MAYOR al stock disponible
        const quantityInput = await driver.findElement(By.css('input[type="number"], [name="quantity"]'));
        const invalidQuantity = currentStock + 50; // Mayor al disponible

        await quantityInput.clear();
        await quantityInput.sendKeys(invalidQuantity.toString());
        console.log(`✓ Cantidad ingresada: ${invalidQuantity} (mayor al stock de ${currentStock})`);

        // Paso 10: Intentar guardar
        const submitButton = await driver.findElement(By.css('button:contains("Guardar"), [type="submit"], .btn-primary'));
        await submitButton.click();
        console.log('✓ Intento de guardar egreso inválido');

        // Paso 11: El sistema DEBE mostrar error de stock insuficiente
        const errorMsg = await driver.wait(
          until.elementLocated(By.css('.error-message, [role="alert"]')),
          10000
        );
        console.log('✓ Mensaje de error visible');

        // Paso 12: Validar que el error sea sobre stock
        const errorContent = await errorMsg.getText();
        assert(
          errorContent.toLowerCase().includes('stock') || 
          errorContent.toLowerCase().includes('negativo') ||
          errorContent.toLowerCase().includes('disponible') ||
          errorContent.toLowerCase().includes('insuficiente'),
          `Error inesperado: ${errorContent}`
        );
        console.log(`✓ Error correcto: "${errorContent}"`);

        // Paso 13: Validar que no se guardó (modal sigue abierto)
        try {
          await driver.findElement(By.css('.modal-overlay'));
          console.log('✓ Modal permanece abierto (no se guardó el egreso inválido)');
        } catch {
          // Si el modal se cerró, es un error
          throw new Error('El egreso inválido se guardó ¡Integridad de BD comprometida!');
        }

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_3.3_stock_negativo.png', screenshot, 'base64');
        throw error;
      }
    });
  });

});
