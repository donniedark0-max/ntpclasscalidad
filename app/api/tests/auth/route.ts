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
    const testUser = users[0];

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`Inicio de sesión fallido. URL actual: ${page.url()}`);
    }
    console.log('✅ Inicio de sesión exitoso.');

    // --- LOGOUT ROBUSTO (VERSIÓN FINAL) ---

    // 1. Localizar y hacer clic en el botón que abre el menú.
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    console.log('🔍 Esperando el botón del menú de usuario...');
    await page.waitForSelector(menuTriggerSelector, { visible: true, timeout: 20000 });
    
    console.log('🖱️ Haciendo clic en el botón del menú...');
    await page.click(menuTriggerSelector); // Un click normal es suficiente aquí.

    // 2. (CAMBIO CRÍTICO) Esperar DIRECTAMENTE por el botón de logout.
    // Esta es la "espera inteligente". Puppeteer sondeará el DOM hasta que el
    // menú se renderice y el botón aparezca, o hasta que se agote el tiempo.
    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    console.log('⏳ Esperando que aparezca el botón "Cerrar sesión" en el menú...');
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { visible: true, timeout: 15000 });

    // 3. Si el botón fue encontrado, hacer clic en él.
    if (!logoutButton) {
      throw new Error('El botón de "Cerrar sesión" nunca apareció después de hacer clic en el menú.');
    }
    
    console.log('🖱️ Haciendo clic en "Cerrar sesión"...');
    await logoutButton.click();
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(LOGIN_URL)) {
      throw new Error(`Cierre de sesión fallido. URL actual: ${page.url()}`);
    }
    console.log('✅ Cierre de sesión exitoso.');
    console.log('✅ Test completado. Tomando captura de pantalla final...');
    
    const screenshotBuffer = await page.screenshot({ type: 'png' });
    const imageBlob = new Blob([new Uint8Array(screenshotBuffer)], { type: 'png' });

    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de autenticación:', error);
    if (page) {
      const pageContent = await page.content();
      console.log('================= INICIO DEL HTML DE LA PÁGINA CON ERROR =================');
      console.log(pageContent);
      console.log('================== FIN DEL HTML DE LA PÁGINA CON ERROR ==================');
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}