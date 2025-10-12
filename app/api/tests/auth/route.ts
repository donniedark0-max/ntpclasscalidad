import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser } from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

export async function GET() {
  let browser: Browser | null = null;
  let page: any = null; // Definir page aquí para acceder en catch

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

    // Login
    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`Inicio de sesión fallido. URL actual: ${page.url()}`);
    }
    console.log('✅ Inicio de sesión exitoso.');

    // --- LOGOUT A PRUEBA DE FALLOS EN VERCEL ---

    // 1. Encontrar el botón del menú de forma explícita.
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    console.log('🔍 Esperando que el botón del menú de usuario sea visible...');
    const menuTrigger = await page.waitForSelector(menuTriggerSelector, { visible: true, timeout: 20000 });
    
    if (!menuTrigger) {
        throw new Error('No se encontró el botón para abrir el menú de usuario.');
    }

    // 2. (CAMBIO CLAVE) Usar page.evaluate para hacer clic con JavaScript.
    // Esto es mucho más fiable en entornos headless que un clic simulado.
    console.log('🖱️ Forzando clic en el botón del menú con page.evaluate...');
    await page.evaluate((selector: string) => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) element.click();
    }, menuTriggerSelector);

    // 3. Aumentar la espera para animaciones en Vercel.
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 4. Buscar el botón de logout.
    const logoutXPathSelector = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÓ', 'abcdefghijklmnopqrstuvwxyzó'), 'Logout')]";
    console.log('🔍 Buscando el botón de "Logout"...');
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { visible: true, timeout: 10000 });

    if (logoutButton) {
      console.log('🖱️ Haciendo clic en "Logout"...');
      await logoutButton.click();
    } else {
      // Este error ya no debería ocurrir, pero lo dejamos por seguridad.
      throw new Error('El botón de "Logout" nunca apareció.');
    }
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(LOGIN_URL)) {
      throw new Error(`Cierre de sesión fallido. URL actual: ${page.url()}`);
    }
    console.log('✅ Cierre de sesión exitoso.');
    console.log('✅ Test completado. Tomando captura de pantalla final...');
    
    const screenshotBuffer = await page.screenshot({ type: 'png' });
    const imageBlob = new Blob([new Uint8Array(screenshotBuffer)], { type: 'image/png' });

    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de autenticación:', error);
    if (page) {
      // (CRUCIAL) Si todo falla, imprime el HTML en los logs.
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