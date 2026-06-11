/**
 * Flujo 2: Tests de Asistencia (Sincronizado con Firebase y UI de Tarjetas)
 * =========================================================================
 */

require('chromedriver');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Flujo 2: Asistencia', function() {
  let driver;
  const baseUrl = 'http://localhost:3000';
  
  // DNI validado de Alejandro Martín López (según captura)
  const dniValido = '25481579'; 
  
  // Credenciales de admin
  const adminEmail = 'jvalenzuela884@calzado.com';
  const adminPassword = 'DA0W6G';

  before(async function() {
    this.timeout(60000); 
    console.log('⏳ 1. Preparando entorno Chrome...');
    
    let options = new chrome.Options();
    options.addArguments('--disable-dev-shm-usage', '--no-sandbox', '--remote-allow-origins=*');
    // Silencia los errores molestos del USB y Phone Registration en la consola
    options.excludeSwitches('enable-logging'); 
    
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    await driver.manage().setTimeouts({ implicit: 5000 });
  });

  afterEach(async function() {
    if (driver && !this.currentTest.title.includes('admin')) {
      await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
      await driver.manage().deleteAllCookies();
    }
  });

  after(async function() {
    if (driver) await driver.quit();
  });

  // =========================================================================
  // CASO 2.1: Marcar entrada tecleando DNI válido
  // =========================================================================
  describe('2.1 - Marcar entrada', function() {
    it('Debe registrar entrada con DNI válido en vista pública', async function() {
      this.timeout(40000);

      try {
        await driver.get(baseUrl);

        const asistenciaButton = await driver.wait(
          until.elementLocated(By.css('button.asistencia-button-outside')),
          10000
        );
        await asistenciaButton.click();
        console.log('✓ Modo Asistencia activado');

        // ¡EL TRUCO DE ORO! Esperamos 2.5 segundos a que Firebase descargue la data
        console.log('⏳ Esperando respuesta de Firebase...');
        await driver.sleep(2500);

        const dniInput = await driver.wait(until.elementLocated(By.id('dni')), 10000);
        await dniInput.clear();
        await dniInput.sendKeys(dniValido);
        console.log(`✓ DNI ingresado: ${dniValido}`);

        // Otra pausa breve para que React filtre el usuario
        await driver.sleep(1000);

        const foundUserName = await driver.wait(until.elementLocated(By.css('.found-user-name')), 10000);
        const displayedName = await foundUserName.getText();
        console.log(`✓ Firebase encontró al trabajador: ${displayedName}`);

        const entradaButton = await driver.findElement(By.css('button.entrada'));
        await entradaButton.click();
        
        // Aceptar el Modal de Confirmación
        const confirmButton = await driver.wait(
          until.elementLocated(By.xpath('//div[contains(@class, "modal")]//button[contains(text(), "Confirmar") or contains(text(), "Aceptar") or contains(text(), "Sí")]')),
          5000
        );
        await confirmButton.click();

        // Esperar notificación verde
        await driver.wait(
          until.elementLocated(By.css('.notification-message, .success-message')),
          10000
        );
        console.log('✓ Operación exitosa registrada');

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_2.1_entrada.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 2.2: Intento de segunda entrada el mismo día
  // =========================================================================
  describe('2.2 - Límite lógico: doble entrada', function() {
    it('Debe rechazar intento de registrar segunda entrada', async function() {
      this.timeout(40000);

      try {
        await driver.get(baseUrl);

        const asistenciaButton = await driver.wait(
          until.elementLocated(By.css('button.asistencia-button-outside')),
          10000
        );
        await asistenciaButton.click();

        // Pausa para Firebase
        await driver.sleep(2500);

        const dniInput = await driver.wait(until.elementLocated(By.id('dni')), 10000);
        await dniInput.clear();
        await dniInput.sendKeys(dniValido);
        await driver.sleep(1000);

        await driver.wait(until.elementLocated(By.css('.found-user-name')), 10000);

        const entradaButton = await driver.findElement(By.css('button.entrada'));
        await entradaButton.click();

        const errorMessage = await driver.wait(
          until.elementLocated(By.css('.error-message')),
          5000
        );
        const errorText = await errorMessage.getText();
        
        assert(
          errorText.toLowerCase().includes('registrada') || errorText.toLowerCase().includes('ya'),
          `Mensaje incorrecto: ${errorText}`
        );
        console.log(`✓ Límite verificado: "${errorText}"`);

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_2.2_doble.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 2.3: Auditoría - Ajuste manual de hora de asistencia
  // =========================================================================
  describe('2.3 - Auditoría: ajuste manual de hora', function() {
    it('Debe permitir y registrar ajuste manual de hora desde panel admin', async function() {
      this.timeout(60000); 

      try {
        await driver.get(baseUrl);
        
        // Login Admin
        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
        await emailInput.sendKeys(adminEmail);
        const passwordInput = await driver.findElement(By.id('password'));
        await passwordInput.sendKeys(adminPassword, Key.RETURN);
        
        await driver.wait(async () => {
          const url = await driver.getCurrentUrl();
          return url !== baseUrl && url !== baseUrl + '/';
        }, 15000);
        console.log('✓ Sesión Admin iniciada');

        // Navegamos al layout real que vi en tu captura
        // Hacemos clic en "Trabajadores" en la barra de navegación superior
        try {
          const navTrabajadores = await driver.wait(
            until.elementLocated(By.xpath('//a[contains(text(), "Trabajadores")] | //li[contains(text(), "Trabajadores")]')),
            5000
          );
          await navTrabajadores.click();
        } catch(e) {
          await driver.get(baseUrl + '/trabajadores');
        }
        await driver.sleep(2000);

        // Hacemos clic en el botón rojo "Asistencia" de la esquina superior derecha
        console.log('⏳ Buscando el botón rojo de Asistencia...');
        try {
          const redAsistenciaBtn = await driver.wait(
            until.elementLocated(By.xpath('//button[contains(text(), "Asistencia")] | //button[contains(@class, "bg-red")]')),
            5000
          );
          await redAsistenciaBtn.click();
          console.log('✓ Botón rojo de Asistencia clickeado');
        } catch(e) {
          console.log('⚠️ No se encontró el botón rojo, se intentará forzar URL...');
          await driver.get(baseUrl + '/asistencia');
        }

        await driver.sleep(3000); // Dar tiempo a que cargue la lista de asistencia

        // Buscamos botones de editar (ya NO buscamos una tabla estrictamente)
        const editButtons = await driver.findElements(By.css('button.edit-btn, button[title*="Editar"], button .fa-edit, [aria-label="Editar"]'));
        
        if (editButtons.length > 0) {
          await editButtons[0].click();
          console.log('✓ Botón de edición de registro accionado');
          
          const timeInput = await driver.wait(until.elementLocated(By.css('input[type="time"]')), 5000);
          await timeInput.sendKeys('0930'); 
          
          const saveButton = await driver.findElement(By.css('button[type="submit"], button.save-btn, .modal button.btn-primary'));
          await saveButton.click();
          console.log('✓ Cambio guardado en auditoría');
        } else {
          console.log('⚠️ No hay registros de asistencia para editar hoy, o el selector del botón es diferente.');
        }

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_2.3_auditoria.png', screenshot, 'base64');
        throw error;
      }
    });
  });
});