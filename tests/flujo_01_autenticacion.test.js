require('chromedriver');
const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Flujo 1: Autenticación y Asistencia (Reconocimiento DNI)', function() {
  let driver;
  const baseUrl = 'http://localhost:3000';
  
  // Credenciales y datos
  const adminEmail = 'jvalenzuela884@calzado.com';
  const adminPassword = 'DA0W6G';
  const trabajadorDni = '25481579'; // El DNI de tu imagen

  before(async function() {
    this.timeout(60000); 
    console.log('⏳ 1. Solicitando apertura de Google Chrome...');
    
    let options = new chrome.Options();
    options.addArguments('--disable-dev-shm-usage', '--no-sandbox', '--remote-allow-origins=*'); 
    options.excludeSwitches('enable-logging'); 
    
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
      
    // Maximizamos para apreciar el flujo
    await driver.manage().window().maximize();
    console.log('✓ 2. Navegador Chrome abierto y maximizado exitosamente.');
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
  // CASO 1.1: Login exitoso con credenciales válidas
  // =========================================================================
  describe('1.1 - Login exitoso', function() {
    it('Debe iniciar sesión como Admin y mostrar la interfaz', async function() {
      this.timeout(40000);

      try {
        await driver.get(baseUrl);
        console.log(`⏳ Navegando a ${baseUrl}...`);

        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
        await emailInput.clear();
        await emailInput.sendKeys(adminEmail);
        await driver.sleep(500); 

        const passwordInput = await driver.findElement(By.id('password'));
        await passwordInput.clear();
        await passwordInput.sendKeys(adminPassword, Key.RETURN);
        console.log('✓ Credenciales enviadas.');

        await driver.wait(async () => {
          const url = await driver.getCurrentUrl();
          return url !== baseUrl && url !== baseUrl + '/'; 
        }, 15000, 'El login no avanzó.');

        await driver.wait(until.elementLocated(By.css('body')), 5000);
        console.log('✓ Redirección exitosa. Pausando visualización...');
        await driver.sleep(3000); 

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_1.1_login_exitoso.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 1.2: Login fallido con credenciales erróneas
  // =========================================================================
  describe('1.2 - Login fallido', function() {
    it('Debe mostrar error por credenciales inválidas', async function() {
      this.timeout(30000);

      try {
        await driver.get(baseUrl);

        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
        await emailInput.clear();
        await emailInput.sendKeys('invalid@correo.com');
        await driver.sleep(500);

        const passwordInput = await driver.findElement(By.id('password'));
        await passwordInput.clear();
        await passwordInput.sendKeys('wrongpassword123', Key.RETURN); 

        const errorMessage = await driver.wait(
          until.elementLocated(By.className('error-message')),
          10000
        );

        assert(await errorMessage.isDisplayed(), 'El error no se renderizó');
        console.log(`✓ Mensaje interceptado: "${await errorMessage.getText()}"`);
        await driver.sleep(2000);

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_1.2_login_fallido.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 1.3: Registro de Asistencia (Solo DNI)
  // =========================================================================
  describe('1.3 - Reconocimiento de DNI en Asistencia', function() {
    it('Debe ir a Asistencia, ingresar el DNI y mostrar el nombre del trabajador', async function() {
      this.timeout(40000);

      try {
        await driver.get(baseUrl);
        console.log('⏳ Buscando el botón de Asistencia...');

        // 1. Clic en el botón "Asistencia Trabajador" de la pantalla de Login
        const btnAsistencia = await driver.wait(
          until.elementLocated(By.xpath('//*[contains(text(), "Asistencia Trabajador")]')),
          10000
        );
        await btnAsistencia.click();
        console.log('✓ Clic en "Asistencia Trabajador". Esperando la vista de registro...');

        // Pausa breve para que Firebase y React carguen el módulo
        await driver.sleep(2000);

        // 2. Localizar el input y tipear el DNI
        const dniInput = await driver.wait(
          until.elementLocated(By.css('input[type="text"], input[type="number"], input#dni, input[name="dni"]')), 
          10000
        );
        await dniInput.clear();
        await dniInput.sendKeys(trabajadorDni);
        console.log(`✓ DNI digitado: ${trabajadorDni}. Esperando validación del sistema...`);

        // 3. Esperar a que el sistema consulte y devuelva el saludo "Hola, Alejandro Martín López"
        const saludoElement = await driver.wait(
          until.elementLocated(By.xpath('//*[contains(text(), "Hola, Alejandro") or contains(text(), "Hola, ")]')),
          10000,
          'No se mostró el saludo con el nombre del trabajador.'
        );

        const textoSaludo = await saludoElement.getText();
        
        // 4. Validación estricta
        assert(textoSaludo.includes('Alejandro'), `El nombre no coincide. Se encontró: ${textoSaludo}`);
        console.log(`✓ ¡Éxito! El sistema reconoció al empleado y renderizó: "${textoSaludo}"`);

        // Pausa de 4 segundos para que aprecies en pantalla que se logró exactamente lo de tu imagen
        await driver.sleep(4000);

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_1.3_reconocimiento_dni.png', screenshot, 'base64');
        throw error;
      }
    });
  });
});