import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser } from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

export async function GET() {
  let browser: Browser | null = null;

  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const usersJson = process.env.TEST_USERS_JSON;
    if (!usersJson) {
      throw new Error('La variable de entorno TEST_USERS_JSON no está definida.');
    }
    const users = JSON.parse(usersJson);
    if (users.length === 0) {
      throw new Error('No se encontraron usuarios de prueba en TEST_USERS_JSON.');
    }
    const testUser = users[0];

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    // Login
    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(DASHBOARD_URL)) {
      await page.screenshot({ path: '/tmp/login_failed.png' });
      throw new Error(`Inicio de sesión fallido. Se tomó captura en /tmp/login_failed.png. URL actual: ${page.url()}`);
    }
    console.log('✅ Inicio de sesión exitoso.');

    // --- LOGOUT A PRUEBA DE FALLOS ---

    // 1. Esperar a que el botón del menú esté visible y listo para el clic.
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    console.log('🔍 Esperando el botón del menú de usuario...');
    await page.waitForSelector(menuTriggerSelector, { visible: true, timeout: 15000 });
    
    console.log('🖱️ Haciendo clic en el botón del menú...');
    await page.click(menuTriggerSelector);
    
  // 2. Esperar un momento a que la animación del menú termine.
  // Aumentamos el tiempo a 1 segundo por si Vercel es lento.
  await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. (PARA DEPURAR) Tomar una captura para ver si el menú se abrió.
    console.log('📸 Tomando captura para verificar que el menú se abrió...');
    await page.screenshot({ path: '/tmp/menu_opened.png' });

    // 4. Buscar el botón de logout.
    const logoutXPathSelector = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÓ', 'abcdefghijklmnopqrstuvwxyzó'), 'cerrar sesión')]";
    console.log('🔍 Buscando el botón de "Cerrar sesión"...');
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { visible: true, timeout: 10000 });

    if (logoutButton) {
      console.log('🖱️ Haciendo clic en "Cerrar sesión"...');
      await logoutButton.click();
    } else {
      throw new Error('El botón de "Cerrar sesión" nunca se hizo visible.');
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
        headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de autenticación:', error);
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        // (CRUCIAL) Tomar una captura en el momento exacto del error.
        await page.screenshot({ path: '/tmp/error_screenshot.png' });
        console.log('📸 Captura de pantalla del error guardada. Revisa los logs.');
      }
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}