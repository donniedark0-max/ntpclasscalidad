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

    // Leer y parsear el JSON de usuarios del .env
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

    // Verificación de inicio de sesión
    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`Inicio de sesión fallido. URL actual: ${page.url()}`);
    }
    console.log('✅ Inicio de sesión exitoso.');

    // --- LOGOUT ROBUSTO ---

    // 1. Abrir el menú
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    await page.waitForSelector(menuTriggerSelector, { visible: true });
    await page.click(menuTriggerSelector);
    
    // 2. (CAMBIO CLAVE) Añadir una pequeña espera explícita
    // Esto da tiempo a que las animaciones del menú terminen.
    await new Promise(resolve => setTimeout(resolve, 500)); // Espera 500 milisegundos

    // 3. (CAMBIO CLAVE) Usar un selector más tolerante
    // Este XPath busca un botón que contenga el texto "Cerrar sesión", ignorando mayúsculas/minúsculas y manejando correctamente la tilde.
    const logoutXPathSelector = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZÓ', 'abcdefghijklmnopqrstuvwxyzó'), 'cerrar sesión')]";
    
    // Aumentamos el tiempo de espera por si la red es lenta
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { timeout: 10000 }); 

    if (logoutButton) {
        await logoutButton.click();
    } else {
        // Si aún falla, lanzamos el error para saberlo
        throw new Error('No se encontró el botón de "Cerrar sesión" después de esperar.');
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Verificar que el logout fue exitoso
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
    // Para depurar mejor, toma una captura de pantalla si hay un error
    if (browser) {
        const page = (await browser.pages())[0];
        if (page) {
            await page.screenshot({ path: '/tmp/error_screenshot.png' });
            console.log('📸 Captura de pantalla del error guardada en /tmp/error_screenshot.png');
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