/**
 * Flujo 2: Gestión de Trabajadores (Modo Visualización Lenta)
 * ==========================================================
 * Fix: Cierre de modales suave (Solo haciendo clic en la "X").
 * Sin recargar la página para no perder el DOM de React.
 */

require('chromedriver');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Flujo 2: Gestión e Interacción de Trabajadores', function() {
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

  // =========================================================================
  // HELPER 1: Login Natural (SSO)
  // =========================================================================
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

  // =========================================================================
  // HELPER 2: Clic Seguro (Anti-Bloqueos iniciales)
  // =========================================================================
  async function clickSeguro(elemento) {
    await driver.executeScript("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", elemento);
    await driver.sleep(1000);
    try {
      await elemento.click();
    } catch (error) {
      if (error.name === 'ElementClickInterceptedError') {
        await driver.executeScript("arguments[0].click();", elemento);
      } else {
        throw error;
      }
    }
  }

  // =========================================================================
  // HELPER 3: Cerrar Modales (LA SOLUCIÓN A LA 'X')
  // =========================================================================
  async function cerrarModal() {
    console.log('   ↩ Cerrando modal (Haciendo clic en la X)...');
    try {
      // Buscamos cualquier cosa que parezca un botón de cerrar ('X', '×', 'Cerrar', 'Cancelar' o la clase 'close')
      const btnCerrar = await driver.findElements(By.xpath('//button[contains(@class, "close") or contains(@class, "btn-close") or contains(translate(text(), "CERRAR", "cerrar"), "cerrar") or contains(translate(text(), "CANCELAR", "cancelar"), "cancelar") or text()="×" or text()="X"]'));
      
      if (btnCerrar.length > 0) {
        // Hacemos clic en el primero que encuentre
        await driver.executeScript("arguments[0].click();", btnCerrar[0]);
      } else {
        // Plan B muy sutil: La tecla Escape
        await driver.actions().sendKeys(Key.ESCAPE).perform();
      }
    } catch(e) {}

    // Pausa para que React termine la animación de desvanecimiento del modal
    await driver.sleep(2000); 
  }

  // =========================================================================
  // PRUEBAS DE FLUJO
  // =========================================================================

  describe('2.0 - Login Inicial (Sanity Check)', function() {
    it('Debe abrir la sesión para todo el flujo', async function() {
      this.timeout(60000);
      await loginAsAdmin();
      console.log('✓ Sesión iniciada y lista para la demostración.');
    });
  });

  describe('2.1 - Navegación e Interacción con Botones Generales', function() {
    it('Debe probar Configurar Planilla, Nuevo Trabajador y Asistencia (Pausado)', async function() {
      this.timeout(300000); 

      console.log('👀 Navegando a Trabajadores...');
      const navTrabajadores = await driver.wait(until.elementLocated(By.xpath('//a[contains(text(), "Trabajadores")]')), 10000);
      await navTrabajadores.click();
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Gestión de Trabajadores")]')), 10000);
      await driver.sleep(3000); 

      // Botón 1
      console.log('\n👉 1. Abriendo "Configurar Planilla"...');
      const btnConfigurar = await driver.findElement(By.xpath('//button[contains(text(), "Configurar Planilla")]'));
      await clickSeguro(btnConfigurar);
      console.log('   ⏸️ Visualizando interfaz por 4 segundos...');
      await driver.sleep(4000); 
      await cerrarModal(); // <--- Aquí usamos la nueva función suave

      // Botón 2
      console.log('\n👉 2. Abriendo "Nuevo Trabajador"...');
      const btnNuevo = await driver.findElement(By.xpath('//button[contains(text(), "Nuevo Trabajador")]'));
      await clickSeguro(btnNuevo);
      console.log('   ⏸️ Visualizando interfaz por 4 segundos...');
      await driver.sleep(4000);
      await cerrarModal();

      // Botón 3
      console.log('\n👉 3. Abriendo "Asistencia"...');
      const btnAsistencia = await driver.findElement(By.xpath('//button[contains(text(), "Asistencia")]'));
      await clickSeguro(btnAsistencia);
      console.log('   ⏸️ Visualizando interfaz por 4 segundos...');
      await driver.sleep(4000);
      await cerrarModal();

      console.log('✓ Botones generales validados con éxito.');
    });
  });

  describe('2.2 - Interacción con Botones de Tarjeta de Empleado', function() {
    it('Debe probar todas las acciones disponibles en la tarjeta del primer trabajador (Pausado)', async function() {
      this.timeout(300000); 

      console.log('\n👀 Centrando la vista en la primera tarjeta de empleado...');
      // Recargamos el selector de la tarjeta para asegurarnos de que no esté "stale"
      const primeraTarjeta = await driver.findElement(By.css('.worker-card, div[class*="card"]'));

      const acciones = [
        "Mostrar Planilla",
        "Ajustar",
        "Historial",
        "Ajustar Sueldo",
        "Agregar Bono"
      ];

      for (const accion of acciones) {
        console.log(`\n👉 Ejecutando acción en empleado: "${accion}"...`);
        // OJO: Volvemos a buscar la tarjeta en cada ciclo para evitar que React la pierda
        const tarjetaActual = await driver.findElement(By.css('.worker-card, div[class*="card"]'));
        const boton = await tarjetaActual.findElement(By.xpath(`.//button[contains(text(), "${accion}")]`));
        
        await clickSeguro(boton);
        
        console.log(`   ⏸️ Visualizando el componente de "${accion}" por 5 segundos...`);
        await driver.sleep(5000); 

        await cerrarModal(); // <--- Cierre suave
      }

      console.log('✓ Todas las interacciones del empleado fueron demostradas.');
    });
  });
});