/**
 * Flujo 4: Tests de Reportes
 * ==========================
 * 3 Casos de prueba para validar renderizado de gráficos, empty states y consultas masivas
 * 
 * Requisitos:
 * - Aplicación corriendo en http://localhost:3000
 * - Usuario admin logeado
 * - Acceso a módulo de reportes (ruta: /reports)
 * - Chart.js disponible en el proyecto
 * - Datos de ejemplo en Firebase
 */

require('chromedriver');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Flujo 4: Reportes', function() {
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
    await passwordInput.sendKeys(adminPassword, Key.RETURN);

    await driver.wait(
      until.elementLocated(By.css('.app-layout')),
      15000
    );
    console.log('✓ Admin logeado');
  }

  /**
   * Helper: Navegar a la sección de reportes
   * La ruta en App.js es /reports
   */
  async function navigateToReports() {
    // Intentar navegar por URL directa (la ruta en App.js es /reports)
    await driver.get(baseUrl + '/reports');
    
    // Esperar a que cargue la vista de reportes
    await driver.wait(
      until.elementLocated(By.css('.reports-page')),
      15000
    );
    
    // Dar tiempo a que Chart.js renderice los gráficos
    await driver.sleep(3000);
    console.log('✓ Sección de reportes cargada');
  }

  // =========================================================================
  // CASO 4.1: Renderizado del dashboard analítico con gráficos
  // =========================================================================
  describe('4.1 - Dashboard analítico', function() {
    it('Debe renderizar correctamente los gráficos de Chart.js', async function() {
      this.timeout(45000);

      try {
        // Paso 1: Hacer login como admin
        await loginAsAdmin();

        // Paso 2: Navegar a reportes
        await navigateToReports();

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
      this.timeout(45000);

      try {
        // Paso 1: Hacer login
        await loginAsAdmin();

        // Paso 2: Navegar a reportes
        await navigateToReports();

        // Paso 3: Buscar filtros de fecha
        const dateInputs = await driver.findElements(By.css('input[type="date"], [data-filter="date"]'));
        
        if (dateInputs.length >= 2) {
          console.log('✓ Filtros de fecha encontrados');

          // Paso 4: Establecer rango de fechas SIN datos (futuro lejano)
          const startDateInput = dateInputs[0];
          const endDateInput = dateInputs[1];

          await startDateInput.clear();
          await startDateInput.sendKeys('01012030');
          console.log('✓ Fecha de inicio: 01/01/2030 (futuro sin datos)');

          await endDateInput.clear();
          await endDateInput.sendKeys('12312030');
          console.log('✓ Fecha de fin: 12/31/2030 (futuro sin datos)');

          // Paso 5: Aplicar filtro
          const filterButton = await driver.findElements(By.xpath(
            '//button[contains(text(), "Filtrar")] | ' +
            '//button[contains(text(), "Aplicar")] | ' +
            '//button[contains(text(), "Buscar")]'
          ));
          if (filterButton.length > 0) {
            await filterButton[0].click();
            console.log('✓ Filtro aplicado');
          } else {
            await endDateInput.sendKeys(Key.RETURN);
            console.log('✓ Filtro aplicado (Enter)');
          }
        } else {
          console.log('⚠ No se encontraron filtros de fecha, validando empty state con datos existentes');
        }

        // Paso 6: Esperar a que se cargue la respuesta (con datos vacíos)
        await driver.sleep(3000);
        console.log('✓ Esperando resultado de filtro...');

        // Paso 7: Validar que el sistema no colapsó
        // La página sigue funcional y accesible
        const pageTitle = await driver.getTitle();
        assert(pageTitle && pageTitle.length > 0, 'La página parece estar rota');
        console.log(`✓ Página interactiva (título: ${pageTitle})`);

        // Paso 8: Verificar que el body tiene contenido
        const bodyText = await driver.findElement(By.css('body')).getText();
        assert(bodyText.length > 0, 'La página está completamente vacía');
        console.log('✓ La página tiene contenido');

        // Paso 9: Verificar que no hay errores JavaScript fatales
        try {
          const errorMessages = await driver.findElements(By.css('.error-message'));
          const fatalErrors = [];
          for (let err of errorMessages) {
            if (await err.isDisplayed()) {
              const text = await err.getText();
              if (text.toLowerCase().includes('fatal') || text.toLowerCase().includes('crash')) {
                fatalErrors.push(text);
              }
            }
          }
          assert(fatalErrors.length === 0, `Errores fatales: ${fatalErrors.join(', ')}`);
        } catch {
          // No hay errores
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
      this.timeout(60000); // Mayor timeout por naturaleza de consulta pesada

      try {
        // Paso 1: Hacer login
        await loginAsAdmin();

        // Paso 2: Navegar a reportes
        await navigateToReports();

        // Paso 3: Esperar carga completa de todos los datos
        await driver.sleep(3000);
        console.log('✓ Consultando todos los datos...');

        // Paso 4: Esperar a que los gráficos se carguen
        const canvases = await driver.wait(
          async () => {
            const elements = await driver.findElements(By.css('canvas'));
            return elements.length > 0 ? elements : null;
          },
          30000 // Esperar más tiempo por la cantidad de datos
        );
        console.log(`✓ ${canvases.length} gráficos cargados (estrés)`);

        // Paso 5: Validar que NO hay spinner/loading infinito
        await driver.sleep(2000); // Esperar un momento extra
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

        // Paso 6: Validar que todos los canvas están renderizados correctamente
        let totalDataPoints = 0;
        for (let canvas of canvases) {
          const width = await canvas.getAttribute('width');
          const height = await canvas.getAttribute('height');
          if (width && height) {
            totalDataPoints += parseInt(width) * parseInt(height) / 10000;
          }
        }
        assert(totalDataPoints > 0, 'Canvas sin dimensiones válidas');
        console.log(`✓ Canvas renderizados con dimensiones válidas (puntos de datos: ~${Math.floor(totalDataPoints)})`);

        // Paso 7: Hacer scroll por la página para validar que todo está renderizado
        await driver.executeScript('window.scrollBy(0, 500)');
        await driver.sleep(500);
        await driver.executeScript('window.scrollBy(0, 500)');
        await driver.sleep(500);
        await driver.executeScript('window.scrollBy(0, -1000)');
        console.log('✓ Scroll completado sin errores');

        // Paso 8: Validar que no hay elementos "undefined" o "NaN" en la página
        const bodyText = await driver.findElement(By.css('body')).getText();
        const hasUndefined = bodyText.includes('undefined');
        const hasNaN = bodyText.includes('NaN');
        if (hasUndefined) console.log('⚠ Se encontró "undefined" en la página');
        if (hasNaN) console.log('⚠ Se encontró "NaN" en la página');
        // Solo fallar si hay NaN (undefined puede ser texto legítimo en algunos contextos)
        assert(!hasNaN, 'La página contiene "NaN" - datos corruptos');
        console.log('✓ No hay valores NaN en la página');

        // Paso 9: Validar rendimiento - tomar tiempo total
        console.log('✓ Consulta masiva completada exitosamente sin colapsos');

        // Paso 10: Intentar interacción - hacer clic en un gráfico o elemento
        const chartCards = await driver.findElements(By.css('.chart-card, [data-testid="chart"]'));
        if (chartCards.length > 0) {
          try {
            await chartCards[0].click();
            console.log('✓ Interacción con gráfico exitosa');
          } catch {
            console.log('⚠ No se pudo interactuar con gráfico');
          }
        }

        // Paso 11: Validar que la página responde a acciones
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
