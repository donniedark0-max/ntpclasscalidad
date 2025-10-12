import { NextResponse, NextRequest } from 'next/server'; // Importar NextRequest
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser } from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

// La función ahora recibe 'request', aunque no la usamos para parámetros de URL, la mantenemos por la firma de Next.js
export async function GET(request: NextRequest) { 
  let browser: Browser | null = null;
  let page: any = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const usersJson = process.env.TEST_USERS_JSON;
    if (!usersJson) throw new Error('TEST_USERS_JSON no está definida.');
    
    const users = JSON.parse(usersJson);
    if (users.length === 0) throw new Error('No hay usuarios de prueba.');

    // --- CAMBIO CLAVE: SELECCIÓN ALEATORIA DE USUARIO ---
    // Selecciona un índice aleatorio basado en la longitud del array de usuarios
    const randomIndex = Math.floor(Math.random() * users.length);
    const testUser = users[randomIndex];
    
    console.log(`🚀 Ejecutando test para el usuario (aleatorio) #${randomIndex}: ${testUser.code}`);
    // --- FIN DEL CAMBIO ---

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    // Login
    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`Inicio de sesión fallido para ${testUser.code}. URL actual: ${page.url()}`);
    }
    console.log('✅ Inicio de sesión exitoso.');

    // Esperar a que el header cargue completamente el nombre del usuario
    const userNameSelector = 'header p.text-sm span.font-bold';
    await page.waitForSelector(userNameSelector, { visible: true, timeout: 15000 });
    console.log('👤 Nombre de usuario cargado.');
    
    // Tomar la captura de pantalla del dashboard
    const screenshotBuffer = await page.screenshot({ type: 'png' });

    // Proceder con el Logout
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    await page.click(menuTriggerSelector);

    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    // Usa page.waitForXPath si estás buscando por XPath sin el prefijo,
    // pero como ya tienes el selector con 'xpath/' es mejor usar el selector que ya tenías:
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { visible: true, timeout: 10000 });
    
    if (!logoutButton) {
      throw new Error('El botón de logout nunca apareció en el menú.');
    }

    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(LOGIN_URL)) {
      throw new Error(`Cierre de sesión fallido. La URL final es: ${page.url()}`);
    }
    console.log('✅ Cierre de sesión exitoso.');

    const imageBlob = new Blob([new Uint8Array(screenshotBuffer)], { type: 'image/png' });

    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de autenticación:', error);
    if (page) {
      // Nota: '/tmp/error_screenshot.png' es específico de sistemas *NIX o entornos con acceso a /tmp
      await page.screenshot({ path: '/tmp/error_screenshot.png' });
      console.log('📸 Captura de pantalla del error guardada en /tmp/error_screenshot.png.');
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}