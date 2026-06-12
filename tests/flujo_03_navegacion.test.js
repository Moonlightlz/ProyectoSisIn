/**
 * Flujo 3: Dashboards, Módulos y Rendimiento (RF-08)
 * ==================================================
 * Matriz Oficial de 4 Casos de Prueba.
 * Fix: Botón azul (Focus) resuelto enviando tecla ENTER nativa.
 */

require('chromedriver');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Flujo 4: Dashboards, Trabajadores y Rendimiento', function() {
  let driver;
  const baseUrl = 'http://localhost:3000';
  const adminEmail = 'jvalenzuela884@calzado.com';
  const adminPassword = 'DA0W6G';

  before(async function() {
    this.timeout(60000);
    console.log('⏳ Inicializando Chrome en Modo Espectador...');
    
    let options = new chrome.Options();
    options.addArguments('--disable-dev-shm-usage', '--no-sandbox', '--remote-allow-origins=*');
    options.excludeSwitches('enable-logging'); 
    
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.manage().window().maximize(); 
    await driver.manage().setTimeouts({ implicit: 5000 });
  });

  afterEach(async function() {
    if (driver) {
      await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
      await driver.manage().deleteAllCookies();
    }
  });

  after(async function() {
    if (driver) await driver.quit();
  });

  // =========================================================================
  // HELPER: Login Definitivo (Tecla ENTER nativa + Verificación visual)
  // =========================================================================
  async function loginAsAdmin() {
    console.log('👀 [Observando] Iniciando sesión...');
    await driver.get(baseUrl);
    await driver.sleep(1000);

    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
    await emailInput.clear();
    await emailInput.sendKeys(adminEmail);
    await driver.sleep(500);

    const passwordInput = await driver.findElement(By.id('password'));
    await passwordInput.clear();
    
    // TRUCO DEFINITIVO: Escribimos la contraseña e inmediatamente disparamos la tecla ENTER
    await passwordInput.sendKeys(adminPassword, Key.RETURN);
    console.log('✓ Tecla ENTER presionada desde el teclado.');

    // Por si acaso, si el botón sigue en pantalla, le mandamos otro ENTER directamente a él
    try {
      const btnEntrar = await driver.findElement(By.css('button[type="submit"]'));
      await btnEntrar.sendKeys(Key.ENTER);
    } catch(e) {}

    console.log('⏳ Esperando a que aparezca tu barra de navegación superior...');
    
    // Esperamos a ver elementos de navegación principales para confirmar acceso
    await driver.wait(
      until.elementLocated(By.xpath('//a[contains(text(), "Reportes")] | //li[contains(text(), "Reportes")] | //a[contains(text(), "Trabajadores")]')),
      15000,
      'Fallo: El sistema se quedó atascado en el Login.'
    );
    console.log('✓ ¡Sesión iniciada! Estamos dentro del sistema.');
  }

  // =========================================================================
  // CASO 4.01: Acceso y Renderizado del Dashboard de Ventas (Inicio)
  // =========================================================================
  describe('4.1 - Acceso al Dashboard de Inicio', function() {
    it('Debe ingresar al sistema y mostrar el Dashboard de Ventas', async function() {
      this.timeout(45000);

      await loginAsAdmin();
      
      console.log('👀 [Observando] Verificando pantalla principal (Inicio)...');
      const tituloInicio = await driver.wait(
        until.elementLocated(By.xpath('//*[contains(text(), "Dashboard de Ventas")]')),
        10000
      );
      
      assert(await tituloInicio.isDisplayed(), 'El título del Dashboard no es visible');
      console.log('✓ Pantalla de Inicio cargada correctamente.');
      await driver.sleep(3000); 
    });
  });

  // =========================================================================
  // CASO 4.02: Navegación y Renderizado de Reportes y Estadísticas
  // =========================================================================
  describe('4.2 - Navegación al Módulo de Reportes', function() {
    it('Debe navegar a Reportes y renderizar los gráficos', async function() {
      this.timeout(45000);

      await loginAsAdmin();

      console.log('👀 [Observando] Haciendo clic en "Reportes" en el menú superior...');
      const navReportes = await driver.findElement(By.xpath('//a[contains(text(), "Reportes")] | //li[contains(text(), "Reportes")]'));
      await navReportes.click();

      const tituloReportes = await driver.wait(
        until.elementLocated(By.xpath('//*[contains(text(), "Reportes y Estadísticas")]')),
        10000
      );
      assert(await tituloReportes.isDisplayed(), 'No se entró al módulo de reportes');

      const charts = await driver.findElements(By.css('canvas, svg, .recharts-wrapper, div[class*="chart"]'));
      assert(charts.length > 0, 'No se renderizaron los gráficos');
      
      console.log(`✓ Módulo de Reportes cargado con ${charts.length} elementos gráficos visibles.`);
      await driver.sleep(3000); 
    });
  });

  // =========================================================================
  // CASO 4.03: Navegación al Módulo de Trabajadores
  // =========================================================================
  describe('4.3 - Navegación al Módulo de Trabajadores', function() {
    it('Debe navegar a Trabajadores y renderizar la vista', async function() {
      this.timeout(45000);

      await loginAsAdmin();
      
      console.log('👀 [Observando] Haciendo clic en "Trabajadores" en el menú superior...');
      const navTrabajadores = await driver.wait(
        until.elementLocated(By.xpath('//a[contains(text(), "Trabajadores")] | //li[contains(text(), "Trabajadores")]')),
        5000
      );
      await navTrabajadores.click();

      // Ajusta este texto ('Trabajadores') si el título de tu pantalla es diferente (ej. 'Lista de Trabajadores')
      const tituloTrabajadores = await driver.wait(
        until.elementLocated(By.xpath('//*[contains(text(), "Trabajadores")]')),
        10000
      );
      assert(await tituloTrabajadores.isDisplayed(), 'No se entró al módulo de trabajadores');
      
      console.log('✓ El sistema navegó exitosamente al módulo de Trabajadores.');
      await driver.sleep(2000);
    });
  });

  // =========================================================================
  // CASO 4.04: Pruebas de Rendimiento (Tiempos de Carga)
  // =========================================================================
  describe('4.4 - Rendimiento de Tiempos de Carga', function() {
    it('El tiempo de carga total del sistema debe ser inferior a 4 segundos', async function() {
      this.timeout(60000);

      await loginAsAdmin();
      
      console.log('👀 [Observando] Recargando la vista y midiendo métricas de rendimiento del navegador...');
      
      // Provocamos una recarga limpia para medir tiempos
      await driver.navigate().refresh();
      await driver.wait(until.elementLocated(By.css('body')), 10000);

      // Usamos la API de Performance nativa del navegador para obtener los tiempos exactos
      const loadTimes = await driver.executeScript(`
        const timing = window.performance.timing;
        return {
          domReady: (timing.domContentLoadedEventEnd - timing.navigationStart) / 1000,
          loadPage: (timing.loadEventEnd - timing.navigationStart) / 1000
        };
      `);
      
      console.log(`📊 Tiempo de DOM Ready (Estructura lista): ${loadTimes.domReady} segundos.`);
      console.log(`📊 Tiempo Total de Carga (Assets e imágenes): ${loadTimes.loadPage} segundos.`);
      
      // Validación estricta: Si la página tarda más de 4 segundos, el test falla.
      assert(loadTimes.loadPage <= 4.0, `⚠️ Fallo de Rendimiento: La carga total tomó ${loadTimes.loadPage}s (Límite: 4.0s)`);
      
      console.log('✓ Prueba superada: Los tiempos de carga del entorno son óptimos y están dentro del estándar.');
      await driver.sleep(3000); 
    });
  });
});