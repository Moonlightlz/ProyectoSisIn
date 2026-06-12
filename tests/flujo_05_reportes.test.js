/**
 * Flujo 3: Interacción de Reportes Comerciales (Modo Visualización Lenta)
 * ======================================================================
 * Arquitectura: SSO (Single Sign-On).
 * Pruebas: Despliegue pausado de los históricos en cada panel estadístico.
 */

require('chromedriver');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Flujo 3: Interacción Activa de Reportes', function() {
  let driver;
  const baseUrl = 'http://localhost:3000';
  const adminEmail = 'jvalenzuela884@calzado.com';
  const adminPassword = 'DA0W6G';

  before(async function() {
    this.timeout(60000);
    console.log('⏳ Inicializando Chrome en Modo Demostración (Velocidad Lenta)...');
    let options = new chrome.Options();
    options.addArguments('--disable-dev-shm-usage', '--no-sandbox', '--remote-allow-origins=*');
    options.excludeSwitches('enable-logging'); 
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.manage().window().maximize(); 
    await driver.manage().setTimeouts({ implicit: 5000 });
  });

  after(async function() {
    if (driver) await driver.quit();
  });

  // HELPER: Login Natural (SSO)
  async function loginAsAdmin() {
    await driver.get(baseUrl);
    await driver.sleep(2000);
    const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
    await emailInput.click();
    await emailInput.clear();
    await emailInput.sendKeys(adminEmail);
    await driver.sleep(1000);
    const passwordInput = await driver.findElement(By.id('password'));
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.sendKeys(adminPassword);
    await driver.sleep(1500); 
    await passwordInput.sendKeys(Key.ENTER);
    try {
      const btnEntrar = await driver.findElement(By.css('button[type="submit"]'));
      await btnEntrar.click();
    } catch (e) {}
    await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Dashboard") or contains(text(), "Inicio")]')), 15000);
    await driver.sleep(3000); 
  }

  // HELPER: Retroceder / Cerrar Modales Lentamente
  async function retrocederOCerrar() {
    console.log('   ↩ Cerrando Histórico (Tecla ESC)...');
    await driver.actions().sendKeys(Key.ESCAPE).perform();
    await driver.sleep(2000);
    try {
      const nav = await driver.findElement(By.xpath('//a[contains(text(), "Reportes")] | //li[contains(text(), "Reportes")]'));
      await nav.click();
    } catch(e) {}
    await driver.sleep(2000);
  }

  describe('3.0 - Login Inicial (Sanity Check)', function() {
    it('Debe abrir la sesión para todo el flujo', async function() {
      this.timeout(60000);
      await loginAsAdmin();
      console.log('✓ Sesión iniciada y lista para la demostración.');
    });
  });

  describe('3.1 - Interacción con Gráficos e Históricos', function() {
    it('Debe interactuar lentamente con los botones de Histórico de cada reporte', async function() {
      this.timeout(300000); // Timeout gigante de 5 minutos

      console.log('👀 Navegando a Reportes...');
      const navReportes = await driver.wait(until.elementLocated(By.xpath('//a[contains(text(), "Reportes")]')), 10000);
      await navReportes.click();
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Reportes y Estadísticas")]')), 10000);
      await driver.sleep(4000); // Pausa inicial para ver todos los gráficos cargar

      // Obtenemos todos los botones de "Histórico"
      const botonesHistorico = await driver.findElements(By.xpath('//button[contains(translate(text(), "HISTORICO", "historico"), "historico") or contains(translate(text(), "HISTÓRICO", "histórico"), "histórico") or contains(text(), "Historico")] | //div[contains(@class, "historico-btn")]'));
      
      console.log(`\n📊 Se encontraron ${botonesHistorico.length} botones de "Histórico". Iniciando escaneo...`);

      // Iteramos sobre cada botón con mucha calma
      for (let i = 0; i < botonesHistorico.length; i++) {
        console.log(`\n👉 Abriendo Histórico del gráfico #${i + 1}...`);
        
        // Scroll suave y pausa para enfocar la vista humana
        await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", botonesHistorico[i]);
        await driver.sleep(2000); 
        
        await botonesHistorico[i].click();
        
        // Pausa muy larga para poder leer la tabla histórica tranquilamente
        console.log(`   ⏸️ Visualizando datos del Histórico #${i + 1} por 5 segundos...`);
        await driver.sleep(5000);

        await retrocederOCerrar();
      }

      console.log('✓ Pruebas de interacción de reportes demostradas con éxito.');
    });
  });
});