/**
 * Flujo 3: Tests de Inventario
 * ============================
 * 3 Casos de prueba para validar registro de materiales, validaciones y restricciones
 * 
 * Requisitos:
 * - Aplicación corriendo en http://localhost:3000
 * - Usuario admin logeado
 * - Acceso a módulo de inventario/materias primas (embebido en Dashboard → "Inventario de Materia Prima")
 * - Firebase conectado para guardar registros
 */

require('chromedriver');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Flujo 3: Inventario', function() {
  let driver;
  const baseUrl = 'http://localhost:3000';
  
  // Credenciales de admin (alineadas con flujo 2)
  const adminEmail = 'jvalenzuela884@calzado.com';
  const adminPassword = 'DA0W6G';

  before(async function() {
    this.timeout(60000);
    console.log('⏳ 1. Preparando entorno Chrome...');
    
    let options = new chrome.Options();
    options.addArguments('--disable-dev-shm-usage', '--no-sandbox', '--remote-allow-origins=*');
    options.excludeSwitches('enable-logging');
    
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.manage().setTimeouts({ implicit: 5000 });
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
    await passwordInput.sendKeys(adminPassword, Key.RETURN);
    console.log('✓ Login clickeado');

    // Esperar redirección al dashboard
    await driver.wait(
      until.elementLocated(By.css('.app-layout')),
      15000
    );
    console.log('✓ Login exitoso - Dashboard visible');
  }

  /**
   * Helper: Navegar al módulo de inventario de materia prima
   * El módulo está embebido dentro de HomePage como una vista interna,
   * se accede haciendo clic en el botón "Inventario de Materia Prima"
   */
  async function navigateToInventory() {
    // Esperar a que el dashboard cargue completamente
    await driver.sleep(2000);

    // Buscar el botón "Inventario de Materia Prima" en el dashboard
    const inventoryButton = await driver.wait(
      until.elementLocated(By.xpath(
        '//button[contains(text(), "Inventario de Materia Prima")] | ' +
        '//button[contains(text(), "Inventario")] | ' +
        '//button[contains(text(), "Materia Prima")]'
      )),
      10000
    );
    await inventoryButton.click();
    console.log('✓ Botón "Inventario de Materia Prima" clickeado');

    // Esperar a que cargue la vista de inventario
    await driver.wait(
      until.elementLocated(By.css('.inventory-container')),
      10000
    );
    await driver.sleep(1500); // Esperar carga de datos desde Firebase
    console.log('✓ Vista de inventario de materia prima cargada');
  }

  // =========================================================================
  // CASO 3.1: Registro de nueva materia prima llenando todos los campos
  // =========================================================================
  describe('3.1 - Nuevo material', function() {
    it('Debe registrar nueva materia prima con todos los campos completos', async function() {
      this.timeout(45000);

      try {
        // Paso 1: Hacer login como admin
        await loginAsAdmin();

        // Paso 2: Navegar al inventario
        await navigateToInventory();

        // Paso 3: Buscar botón "Nuevo Material" o "Agregar"
        const newMaterialButton = await driver.wait(
          until.elementLocated(By.xpath(
            '//button[contains(text(), "Nuevo")] | ' +
            '//button[contains(text(), "Agregar")] | ' +
            '//button[contains(text(), "Añadir")]'
          )),
          10000
        );
        console.log('✓ Botón de nuevo material localizado');
        await newMaterialButton.click();
        console.log('✓ Botón clickeado');

        // Paso 4: Esperar modal del formulario
        await driver.wait(
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
        try {
          const supplierInput = await driver.findElement(By.id('supplier'));
          await supplierInput.clear();
          await supplierInput.sendKeys('Curtidos del Norte');
          console.log('✓ Proveedor ingresado: Curtidos del Norte');
        } catch(e) {
          console.log('⚠ Campo proveedor no encontrado, continuando...');
        }

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
        try {
          const costInput = await driver.findElement(By.id('cost'));
          await costInput.clear();
          await costInput.sendKeys('95.50');
          console.log('✓ Costo unitario ingresado: 95.50');
        } catch(e) {
          console.log('⚠ Campo costo no encontrado, continuando...');
        }

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
        await driver.sleep(2000); // Esperar refresco
        await driver.wait(
          async () => {
            try {
              const pageText = await driver.findElement(By.css('.inventory-container')).getText();
              if (pageText.includes('Cuero Vacuno Premium')) {
                console.log('✓ Material visible en inventario');
                return true;
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
      this.timeout(45000);

      try {
        // Paso 1: Hacer login
        await loginAsAdmin();

        // Paso 2: Navegar a inventario
        await navigateToInventory();

        // Paso 3: Abrir nuevo material
        const newButton = await driver.wait(
          until.elementLocated(By.xpath(
            '//button[contains(text(), "Nuevo")] | ' +
            '//button[contains(text(), "Agregar")] | ' +
            '//button[contains(text(), "Añadir")]'
          )),
          10000
        );
        await newButton.click();
        console.log('✓ Abriendo formulario de material');

        // Paso 4: Esperar modal
        await driver.wait(
          until.elementLocated(By.css('.modal-overlay, [role="dialog"]')),
          10000
        );
        console.log('✓ Modal visible');

        // Paso 5: NO llenar NINGÚN campo (dejarlos vacíos)
        // Solo intentar hacer clic en guardar directamente
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
          until.elementLocated(By.css('.error-message, [role="alert"], .validation-error')),
          10000
        );
        console.log('✓ Mensaje de error aparece');

        // Paso 8: Validar que el error es sobre campos obligatorios
        const errorText = await errorMessage.getText();
        assert(
          errorText.toLowerCase().includes('obligatorio') || 
          errorText.toLowerCase().includes('requerido') ||
          errorText.toLowerCase().includes('vacío') ||
          errorText.toLowerCase().includes('nombre') ||
          errorText.toLowerCase().includes('campo'),
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
      this.timeout(45000);

      try {
        // Paso 1: Hacer login
        await loginAsAdmin();

        // Paso 2: Navegar a inventario
        await navigateToInventory();

        // Paso 3: Esperar a que la tabla de materiales cargue
        await driver.sleep(2000);
        
        const rows = await driver.wait(
          async () => {
            const tableRows = await driver.findElements(By.css('.inventory-table tbody tr, table tbody tr'));
            return tableRows.length > 0 ? tableRows : null;
          },
          10000
        );
        assert(rows.length > 0, 'No hay materiales en tabla');
        console.log(`✓ ${rows.length} materiales cargados en tabla`);

        // Paso 4: Buscar el botón de egreso/salida en la primera fila
        // o buscar un botón global de movimiento de stock
        let egressButton;
        try {
          // Intentar encontrar botón de egreso directo en la fila
          egressButton = await rows[0].findElement(By.xpath(
            './/button[contains(text(), "Egreso")] | ' +
            './/button[contains(text(), "Salida")] | ' +
            './/button[contains(@class, "egreso")] | ' +
            './/button[contains(@class, "out")]'
          ));
        } catch(e) {
          // Si no hay botón directo, clic en la fila y luego buscar
          await rows[0].click();
          console.log('✓ Fila de material seleccionada');
          await driver.sleep(1000);
          
          egressButton = await driver.wait(
            until.elementLocated(By.xpath(
              '//button[contains(text(), "Egreso")] | ' +
              '//button[contains(text(), "Salida")] | ' +
              '//button[contains(text(), "Movimiento")]'
            )),
            5000
          );
        }
        
        await egressButton.click();
        console.log('✓ Botón de egreso clickeado');

        // Paso 5: Esperar modal de movimiento
        await driver.wait(
          until.elementLocated(By.css('.modal-overlay, [role="dialog"]')),
          10000
        );
        console.log('✓ Modal de movimiento visible');

        // Paso 6: Si hay un select de tipo de movimiento, seleccionar "Egreso"
        try {
          const typeSelect = await driver.findElement(By.css('select[name="type"], select[id="type"], select[name="movementType"]'));
          await typeSelect.sendKeys('Egreso');
          console.log('✓ Tipo de movimiento seleccionado: Egreso');
        } catch(e) {
          console.log('⚠ No se encontró selector de tipo, continuando...');
        }

        // Paso 7: Intentar ingresar cantidad excesiva
        const quantityInput = await driver.findElement(By.css('input[type="number"], [name="quantity"], #quantity'));
        const invalidQuantity = 999999; // Cantidad absurdamente alta
        
        await quantityInput.clear();
        await quantityInput.sendKeys(invalidQuantity.toString());
        console.log(`✓ Cantidad ingresada: ${invalidQuantity} (excede cualquier stock)`);

        // Paso 8: Intentar guardar
        const submitButton = await driver.findElement(By.css('button.btn-primary, [type="submit"]'));
        await submitButton.click();
        console.log('✓ Intento de guardar egreso inválido');

        // Paso 9: El sistema DEBE mostrar error de stock insuficiente
        const errorMsg = await driver.wait(
          until.elementLocated(By.css('.error-message, [role="alert"], .validation-error')),
          10000
        );
        console.log('✓ Mensaje de error visible');

        // Paso 10: Validar que el error sea sobre stock
        const errorContent = await errorMsg.getText();
        assert(
          errorContent.toLowerCase().includes('stock') || 
          errorContent.toLowerCase().includes('negativo') ||
          errorContent.toLowerCase().includes('disponible') ||
          errorContent.toLowerCase().includes('insuficiente') ||
          errorContent.toLowerCase().includes('excede') ||
          errorContent.toLowerCase().includes('supera'),
          `Error inesperado: ${errorContent}`
        );
        console.log(`✓ Error correcto: "${errorContent}"`);

        // Paso 11: Validar que no se guardó (modal sigue abierto)
        try {
          await driver.findElement(By.css('.modal-overlay'));
          console.log('✓ Modal permanece abierto (no se guardó el egreso inválido)');
        } catch {
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
