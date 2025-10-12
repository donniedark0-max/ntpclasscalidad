import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser } from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

export async function GET() {
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
  // Selección aleatoria de usuario para la prueba
  const testUser = users[Math.floor(Math.random() * users.length)];

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    // Login
    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`Inicio de sesión fallido. URL actual: ${page.url()}`);
    }
    console.log('✅ Inicio de sesión exitoso.');

    // --- 1. ESPERAR A QUE EL HEADER CARGUE COMPLETAMENTE ---
    // Basado en tu código de Header.tsx, esperamos a que el nombre del usuario (en un span con font-bold) sea visible.
    // Esto significa que el estado 'loading' ha terminado y la API ha respondido.
    console.log('⏳ Esperando que cargue el nombre del usuario en el header...');
    const userNameSelector = 'header p.text-sm span.font-bold';
    await page.waitForSelector(userNameSelector, { visible: true, timeout: 15000 });
    
    console.log('👤 Nombre de usuario cargado. ¡El dashboard está completamente renderizado!');
    
    // --- 2. TOMAR LA CAPTURA DE PANTALLA DE ÉXITO ---
    // Este es el momento perfecto para la captura, ya que prueba que el login y la carga de datos funcionan.
    console.log('📸 Tomando captura de pantalla del dashboard cargado...');
    const screenshotBuffer = await page.screenshot({ type: 'png' });

    // --- 3. PROCEDER CON EL LOGOUT ---
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    console.log('🔍 Buscando el menú de usuario para cerrar sesión...');
    await page.click(menuTriggerSelector);

    // Esperamos a que el botón "Cerrar sesión" aparezca en el menú desplegable.
    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    console.log('⏳ Esperando que aparezca el botón "Cerrar sesión"...');
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
    console.log('✅ Test de ciclo completo (Login y Logout) finalizado.');

    // Devolvemos la captura del dashboard que tomamos antes.
    const imageBlob = new Blob([new Uint8Array(screenshotBuffer)], { type: 'image/png' });

    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de autenticación:', error);
    if (page) {
      await page.screenshot({ path: '/tmp/error_screenshot.png' });
      console.log('📸 Captura de pantalla del error guardada.');
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}