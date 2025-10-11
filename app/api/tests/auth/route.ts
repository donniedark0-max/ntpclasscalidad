import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

export async function GET() {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false, // <--- Cambiar a true en caso de no querer ver el navegador
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });

    await page.type('#username', process.env.TEST_USER_CODE!);
    await page.type('#password', process.env.TEST_USER_PASSWORD!);

    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const currentUrl = page.url();
    if (!currentUrl.startsWith(DASHBOARD_URL)) {
      throw new Error(`Inicio de sesión fallido. URL actual: ${currentUrl}`);
    }

    // ¡IMPORTANTE! Cambia este selector por el de tu botón real para cerrar sesión.
    const logoutSelector = '#logout-button'; // <--- falta boton de cerrado de sesion
    await page.waitForSelector(logoutSelector);
    await page.click(logoutSelector);

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const finalUrl = page.url();
    if (!finalUrl.includes(LOGIN_URL)) {
        throw new Error(`Cierre de sesión fallido. URL final: ${finalUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Prueba de autenticación (Login y Logout) completada con éxito.'
    });

  } catch (error) {
    console.error('Error en la prueba de autenticación:', error);

    if (browser) {
      const page = (await browser.pages())[0];
      await page.screenshot({ path: 'public/error-auth-test.png' });
    }

    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}