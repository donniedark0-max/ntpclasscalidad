import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser'; 
import { Browser } from 'puppeteer';
import { logout } from '@/lib/puppeteer-helpers';

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

  // Use shared logout helper (selector robusto y espera)
  await logout(page);
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