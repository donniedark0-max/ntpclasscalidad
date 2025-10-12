import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser'; // CAMBIO 1: Importar tu helper
import { Browser } from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

export async function GET() {
  let browser: Browser | null = null;

  try {
    // CAMBIO 2: Usar el helper para obtener la instancia del navegador
    // Esto funciona automáticamente en local y en Vercel
    browser = await getBrowser();

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // CAMBIO 3: Leer y parsear el JSON de usuarios del .env
    const usersJson = process.env.TEST_USERS_JSON;
    if (!usersJson) {
      throw new Error('La variable de entorno TEST_USERS_JSON no está definida.');
    }
    const users = JSON.parse(usersJson);
    if (users.length === 0) {
      throw new Error('No se encontraron usuarios de prueba en TEST_USERS_JSON.');
    }
    // Usamos el primer usuario para la prueba
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

    // Logout
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    await page.waitForSelector(menuTriggerSelector);
    await page.click(menuTriggerSelector);
    
    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`);
    if (logoutButton) {
        await logoutButton.click();
    } else {
        throw new Error('No se encontró el botón de "Cerrar sesión".');
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // CAMBIO 4: Verificar que el logout fue exitoso
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
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    // Devolvemos un error en formato JSON para que sea más fácil de depurar
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}