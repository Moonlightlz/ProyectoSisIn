require('chromedriver');
const { Builder, By, until, Key } = require('selenium-webdriver'); // Agregamos 'Key'
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('Flujo 1: Autenticación', function() {
  let driver;
  const baseUrl = 'http://localhost:3000';
  
  // Tus credenciales reales
  const adminEmail = 'jvalenzuela884@calzado.com';
  const adminPassword = 'DA0W6G';
  const workerEmail = 'dzandoval623@calzado.com';
  const workerPassword = '6JRZ3R';

  before(async function() {
    this.timeout(60000); 
    console.log('⏳ 1. Solicitando apertura de Google Chrome...');
    
    let options = new chrome.Options();
    options.addArguments('--disable-dev-shm-usage'); 
    options.addArguments('--no-sandbox'); 
    options.addArguments('--remote-allow-origins=*'); 
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
      
    console.log('✓ 2. Navegador Chrome abierto exitosamente.');
    await driver.manage().setTimeouts({ implicit: 5000 });
  });

  afterEach(async function() {
    if (driver) {
      await driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
      await driver.manage().deleteAllCookies();
    }
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  // =========================================================================
  // CASO 1.1: Login exitoso con credenciales válidas
  // =========================================================================
  describe('1.1 - Login exitoso', function() {
    it('Debe redirigir al layout después de login', async function() {
      this.timeout(30000);

      try {
        await driver.get(baseUrl);
        console.log(`⏳ Navegando a ${baseUrl}...`);

        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
        await emailInput.clear();
        await emailInput.sendKeys(adminEmail);
        await driver.sleep(500); // Pausa para que React registre el texto

        const passwordInput = await driver.findElement(By.id('password'));
        await passwordInput.clear();
        
        // TRUCO: Enviamos la contraseña y presionamos ENTER directamente
        await passwordInput.sendKeys(adminPassword, Key.RETURN);
        console.log('✓ Credenciales enviadas con tecla ENTER');

        // Validar éxito esperando a que la URL cambie (ya no estamos en el login)
        await driver.wait(async () => {
          const url = await driver.getCurrentUrl();
          // Retorna verdadero si la URL ya no es exactamente localhost:3000
          return url !== baseUrl && url !== baseUrl + '/'; 
        }, 15000, 'El login no avanzó. Revisa si Firebase bloqueó la IP o si los datos son incorrectos.');
        
        console.log('✓ Redirección al sistema exitosa');

        const currentUrl = await driver.getCurrentUrl();
        assert(
          currentUrl.includes('/home') || currentUrl.includes('/dashboard') || currentUrl !== baseUrl,
          `URL post-login inesperada: ${currentUrl}`
        );

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
        await passwordInput.sendKeys('wrongpassword123', Key.RETURN); // Presionamos ENTER
        console.log('✓ Intento de login fallido enviado');

        const errorMessage = await driver.wait(
          until.elementLocated(By.className('error-message')),
          10000
        );

        const isErrorVisible = await errorMessage.isDisplayed();
        assert(isErrorVisible, 'El mensaje de error no se renderizó en la UI');

        const errorText = await errorMessage.getText();
        console.log(`✓ Mensaje interceptado de la UI: "${errorText}"`);

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_1.2_login_fallido.png', screenshot, 'base64');
        throw error;
      }
    });
  });

  // =========================================================================
  // CASO 1.3: Restricción de rutas - Trabajador en zona de administración
  // =========================================================================
  describe('1.3 - Restricción de rutas', function() {
    it('Debe bloquear acceso a /admin/users para usuario trabajador', async function() {
      this.timeout(30000);

      try {
        await driver.get(baseUrl);

        const emailInput = await driver.wait(until.elementLocated(By.id('email')), 10000);
        await emailInput.clear();
        await emailInput.sendKeys(workerEmail);
        await driver.sleep(500);

        const passwordInput = await driver.findElement(By.id('password'));
        await passwordInput.clear();
        await passwordInput.sendKeys(workerPassword, Key.RETURN); // Presionamos ENTER
        console.log('✓ Sesión iniciada con perfil de Trabajador');

        // Esperamos a que salga de la pantalla de login
        await driver.wait(async () => {
          const url = await driver.getCurrentUrl();
          return url !== baseUrl && url !== baseUrl + '/';
        }, 15000);

        // Forzar navegación por URL a zona restringida
        await driver.get(baseUrl + '/admin/users');
        console.log('✓ Intento de navegación forzada a /admin/users');

        // Validar que el enrutador lo expulse
        await driver.wait(async () => {
          const url = await driver.getCurrentUrl();
          return !url.includes('/admin/users');
        }, 10000);

        const finalUrl = await driver.getCurrentUrl();
        const accessBlocked = !finalUrl.includes('/admin/users');
        assert(accessBlocked, `Falla de seguridad: El trabajador pudo entrar. URL: ${finalUrl}`);
        console.log('✓ Seguridad confirmada. El sistema bloqueó el acceso.');

      } catch (error) {
        const screenshot = await driver.takeScreenshot();
        require('fs').writeFileSync('./debug_1.3_restriccion_rutas.png', screenshot, 'base64');
        throw error;
      }
    });
  });
});