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
      // Si el login falla, toma una captura para ver qué pasó
      await page.screenshot({ path: '/tmp/login_failed.png' });
      throw new Error(`Inicio de sesión fallido. URL actual: ${page.url()}`);
    }
    
    console.log('✅ Inicio de sesión exitoso.');
    
    // --- CAMBIO PRINCIPAL ---
    // El test ahora termina aquí con éxito.
    
    console.log('✅ Test completado. Tomando captura del dashboard...');
    
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
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}