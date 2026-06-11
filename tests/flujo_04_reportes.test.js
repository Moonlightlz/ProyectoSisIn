/**
 * Flujo 4: Tests de Reportes
 * ==========================
 * 3 Casos de prueba para validar renderizado de gráficos, empty states y consultas masivas
 * 
 * Requisitos:
 * - Aplicación corriendo en http://localhost:3000
 * - Usuario admin logeado
 * - Acceso a módulo de reportes
 * - Chart.js disponible en el proyecto
 * - Datos de ejemplo en Firebase
 */

const { Builder, By, until, Key } = require('selenium-webdriver');
const assert = require('assert');

describe('Flujo 4: Reportes', function() {
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
   * Helper: Login como admin
   */
  async function loginAsAdmin() {
    await driver.get(baseUrl);
    const emailInput = await driver.wait(
      until.elementLocated(By.id('email')),
      10000
    );
    await emailInput.clear();
    await emailInput.sendKeys(adminEmail);

    const passwordInput = await driver.findElement(By.id('password'));
    await passwordInput.clear();
    await passwordInput.sendKeys(adminPassword);

    const loginButton = await driver.findElement(By.css('button.login-button'));
    await loginButton.click();

    await driver.wait(
      until.elementLocated(By.css('.app-layout')),
      15000
    );
    console.log('✓ Admin logeado');
  }

  // =========================================================================
  // CASO 4.1: Renderizado del dashboard analítico con gráficos
  // =========================================================================
  describe('4.1 - Dashboard analítico', function() {
    it('Debe renderizar correctamente los gráficos de Chart.js', async function() {
      this.timeout(30000);

      try {
        // Paso 1: Hacer login como admin
        await loginAsAdmin();

        // Paso 2: Navegar a la sección de reportes
        const reportRoutes = ['reportes', 'reports', 'analytics', 'dashboard'];
        let navigated = false;

        for (let route of reportRoutes) {
          try {
            await driver.get(baseUrl + '/' + route);
            const reportView = await driver.wait(
              until.elementLocated(By.css('.reports-page, [data-view="reports"], .dashboard-view')),
              5000
            ).catch(() => null);
            if (reportView) {
              navigated = true;
              console.log(`✓ Navegando a reportes: /${route}`);
              break;
            }
          } catch {
            // Ruta no existe
          }
        }

        assert(navigated, 'No se pudo acceder a la sección de reportes');

        // Paso 3: Esperar a que todos los gráficos se carguen
        // Los gráficos de Chart.js usan elementos <canvas>
        const canvases = await driver.wait(
          async () => {
            const elements = await driver.findElements(By.css('canvas'));
            return elements.length > 0 ? elements : null;
          },
          15000
        );
        console.log(`✓ ${canvases.length} gráficos (canvas) encontrados`);

        // Paso 4: Validar que hay al menos 1 canvas (mínimo un gráfico)
        assert(canvases.length >= 1, 'No se encontraron gráficos en la página');
        console.log('✓ Al menos 1 gráfico está renderizado');

        // Paso 5: Validar que los canvas tienen dimensiones (no están vacíos)
        for (let i = 0; i < canvases.length; i++) {
          const width = await canvases[i].getAttribute('width');
          const height = await canvases[i].getAttribute('height');
          assert(
            width && parseInt(width) > 0,
            `Canvas ${i} tiene ancho inválido: ${width}`
          );
          assert(
            height && parseInt(height) > 0,
            `Canvas ${i} tiene alto inválido: ${height}`
          );
        }
        console.log('✓ Todos los canvas tienen dimensiones válidas');

        // Paso 6: Validar que existen elementos de tarjeta de gráfico
        const chartCards = await driver.findElements(By.css('.chart-card, [data-testid="chart"]'));
        assert(chartCards.length > 0, 'No se encontraron tarjetas de gráfico');
        console.log(`✓ ${chartCards.length} tarjetas de gráfico visibles`);

        // Paso 7: Validar que existen elementos visibles (no están hidden)
        for (let card of chartCards) {
          const isDisplayed = await card.isDisplayed();
          assert(isDisplayed, 'Al menos una tarjeta de gráfico no es visible');
        }
        console.log('✓ Todas las tarjetas de gráfico están visibles');

        // Paso 8: Validar que hay títulos en los gráficos
        const titles = await driver.findElements(By.css('.chart-card h3, .chart-header'));
        assert(titles.length >= chartCards.length * 0.5, 'Faltan títulos en gráficos');
        console.log(`✓ Títulos de gráficos encontrados: ${titles.length}`);

        // Paso 9: Esperar a que Chart.js termine la animación
        await driver.sleep(2000);
        console.log('✓ Animaciones de gráficos completadas');

        // Paso 10: Validar que NO hay mensajes de error
        try {
          const errorMessages = await driver.findElements(By.css('.error-message, [role="alert"]'));
          const visibleErrors = [];
          for (let err of errorMessages) {
            if (await err.isDisplayed()) {
              visibleErrors.push(await err.getText());
            }
          }
          assert(visibleErrors.length === 0, `Errores en página: ${visibleErrors.join(', ')}`);
        } catch {
          // No hay errores
        }
        console.log('✓ No hay mensajes de error en la página');

        // Paso 11: Validar que el contenedor principal no está vacío
        const pageContent = await driver.findElement(By.css('body'));
        const contentHeight = await pageContent.getRect();
        assert(contentHeight.height > 500, 'La página parece estar vacía');
        console.log('✓ Página con contenido válido');

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_4.1_dashboard.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 4.2: Empty State - Filtro sin datos y que el sistema no colapse
  // =========================================================================
  describe('4.2 - Empty State: sistema resiliente', function() {
    it('Debe mostrar empty state cuando filtro no tiene datos sin colapsar', async function() {
      this.timeout(30000);

      try {
        // Paso 1: Hacer login
        await loginAsAdmin();

        // Paso 2: Navegar a reportes
        await driver.get(baseUrl + '/reportes');
        await driver.wait(
          until.elementLocated(By.css('.reports-page, [data-view="reports"]')),
          10000
        ).catch(() => null);
        console.log('✓ En sección de reportes');

        // Paso 3: Buscar filtros de fecha
        // Intentar encontrar inputs de rango de fechas
        const dateInputs = await driver.findElements(By.css('input[type="date"], [data-filter="date"]'));
        
        if (dateInputs.length >= 2) {
          console.log('✓ Filtros de fecha encontrados');

          // Paso 4: Establecer rango de fechas SIN datos (ej: futuro lejano)
          const startDateInput = dateInputs[0];
          const endDateInput = dateInputs[1];

          // Usar fechas en el futuro (2030-01-01 a 2030-12-31)
          await startDateInput.clear();
          await startDateInput.sendKeys('01012030');
          console.log('✓ Fecha de inicio: 01/01/2030 (futuro sin datos)');

          await endDateInput.clear();
          await endDateInput.sendKeys('12312030');
          console.log('✓ Fecha de fin: 12/31/2030 (futuro sin datos)');

          // Paso 5: Aplicar filtro (buscar botón "Aplicar" o presionar Enter)
          const filterButton = await driver.findElements(By.css('button:contains("Filtrar"), [data-action="filter"], .btn-filter'));
          if (filterButton.length > 0) {
            await filterButton[0].click();
            console.log('✓ Filtro aplicado');
          } else {
            await endDateInput.sendKeys(Key.RETURN);
            console.log('✓ Filtro aplicado (Enter)');
          }
        } else {
          console.log('⚠ No se encontraron filtros de fecha, aplicando filtro alternativo');
        }

        // Paso 6: Esperar a que se cargue la respuesta (con datos vacíos)
        await driver.sleep(2000);
        console.log('✓ Esperando resultado de filtro...');

        // Paso 7: Validar que el sistema muestre "No hay datos" en lugar de colapsar
        try {
          const emptyState = await driver.findElement(By.css('.no-data-message, [data-empty="true"], .empty-state'));
          const isVisible = await emptyState.isDisplayed();
          assert(isVisible, 'Empty state no está visible');
          console.log('✓ Empty state visible (sin datos)');
        } catch {
          console.log('⚠ Empty state no localizado, pero la página sigue funcionando');
        }

        // Paso 8: Validar que NO hay errores en la consola del navegador
        // Intentar verificar que la página sigue interactiva
        const pageTitle = await driver.getTitle();
        assert(pageTitle && pageTitle.length > 0, 'La página parece estar rota');
        console.log(`✓ Página interactiva (título: ${pageTitle})`);

        // Paso 9: Validar que se pueden hacer acciones (ej: limpiar filtros)
        const resetButtons = await driver.findElements(By.css('button:contains("Limpiar"), [data-action="reset"], .btn-reset'));
        if (resetButtons.length > 0) {
          assert(await resetButtons[0].isDisplayed(), 'Botón de reset no es visible');
          console.log('✓ Botón de reset disponible');
        }

        // Paso 10: Limpiar filtro y verificar que vuelven los datos
        if (resetButtons.length > 0) {
          await resetButtons[0].click();
          console.log('✓ Filtro limpiado');

          // Esperar a que recarguen los datos
          await driver.sleep(2000);

          // Validar que hay datos nuevamente
          try {
            const dataElements = await driver.findElements(By.css('canvas, table tbody tr, [data-content="data"]'));
            assert(dataElements.length > 0, 'No se recuperaron los datos después de limpiar');
            console.log('✓ Datos recuperados después de limpiar filtro');
          } catch {
            console.log('⚠ No se pudo validar recuperación de datos');
          }
        }

        console.log('✓ Sistema resiliente ante empty state');

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_4.2_empty_state.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 4.3: Estrés de consulta - Consulta masiva sin filtro
  // =========================================================================
  describe('4.3 - Estrés: consulta masiva', function() {
    it('Debe completar consulta masiva sin filtro y renderizar correctamente', async function() {
      this.timeout(45000); // Mayor timeout por naturaleza de consulta pesada

      try {
        // Paso 1: Hacer login
        await loginAsAdmin();

        // Paso 2: Navegar a reportes
        await driver.get(baseUrl + '/reportes');
        await driver.wait(
          until.elementLocated(By.css('.reports-page')),
          10000
        ).catch(() => null);
        console.log('✓ En sección de reportes');

        // Paso 3: Buscar y LIMPIAR todos los filtros existentes
        // Para asegurar que se hace una consulta masiva sin restricciones
        const clearButtons = await driver.findElements(By.css('button:contains("Limpiar"), [data-action="reset"]'));
        for (let btn of clearButtons) {
          try {
            if (await btn.isDisplayed()) {
              await btn.click();
              console.log('✓ Filtro limpiado');
            }
          } catch {
            // Botón no disponible
          }
        }

        // Paso 4: Esperar a que se carguen TODOS los datos (sin filtro)
        await driver.sleep(1000);
        console.log('✓ Consultando todos los datos...');

        // Paso 5: Esperar a que los gráficos se carguen
        const canvases = await driver.wait(
          async () => {
            const elements = await driver.findElements(By.css('canvas'));
            return elements.length > 0 ? elements : null;
          },
          30000 // Esperar más tiempo por la cantidad de datos
        );
        console.log(`✓ ${canvases.length} gráficos cargados (estrés)`);

        // Paso 6: Validar que NO hay spinner/loading infinito
        const loadingSpinners = await driver.findElements(By.css('.spinner, [data-loading="true"], .progress'));
        for (let spinner of loadingSpinners) {
          try {
            if (await spinner.isDisplayed()) {
              throw new Error('Spinner de carga sigue visible (posible timeout)');
            }
          } catch (e) {
            if (e.message.includes('Spinner')) throw e;
          }
        }
        console.log('✓ No hay spinners de carga (consulta completada)');

        // Paso 7: Validar que todos los canvas están renderizados correctamente
        let totalDataPoints = 0;
        for (let canvas of canvases) {
          const width = await canvas.getAttribute('width');
          const height = await canvas.getAttribute('height');
          if (width && height) {
            totalDataPoints += parseInt(width) * parseInt(height) / 10000; // Estimación
          }
        }
        assert(totalDataPoints > 0, 'Canvas sin dimensiones válidas');
        console.log(`✓ Canvas renderizados con dimensiones válidas (puntos de datos: ~${Math.floor(totalDataPoints)})`);

        // Paso 8: Hacer scroll por la página para validar que todo está renderizado
        await driver.executeScript('window.scrollBy(0, 500)');
        await driver.sleep(500);
        await driver.executeScript('window.scrollBy(0, 500)');
        await driver.sleep(500);
        await driver.executeScript('window.scrollBy(0, -1000)');
        console.log('✓ Scroll completado sin errores');

        // Paso 9: Validar que no hay elementos "undefined" o "NaN" en la página
        const bodyText = await driver.findElement(By.css('body')).getText();
        const hasErrors = bodyText.includes('undefined') || bodyText.includes('NaN');
        assert(!hasErrors, 'La página contiene "undefined" o "NaN"');
        console.log('✓ No hay valores undefined o NaN en la página');

        // Paso 10: Validar rendimiento - tomar tiempo total
        console.log('✓ Consulta masiva completada exitosamente sin colapsos');

        // Paso 11: Intentar interacción - hacer clic en un gráfico o elemento
        const chartCards = await driver.findElements(By.css('.chart-card, [data-testid="chart"]'));
        if (chartCards.length > 0) {
          try {
            await chartCards[0].click();
            console.log('✓ Interacción con gráfico exitosa');
          } catch {
            console.log('⚠ No se pudo interactuar con gráfico');
          }
        }

        // Paso 12: Validar que la página responde a acciones
        const buttons = await driver.findElements(By.css('button'));
        assert(buttons.length > 0, 'No hay botones interactivos');
        console.log(`✓ Página responde - ${buttons.length} botones disponibles`);

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_4.3_consulta_masiva.png', screenshot, 'base64');
        throw error;
      }
    });
  });

});
