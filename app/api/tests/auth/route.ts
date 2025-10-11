import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

export async function GET() {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false, // Déjalo en false para ver al bot en acción
      slowMo: 100,
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
      throw new Error(`Inicio de sesión fallido. Se esperaba ir a ${DASHBOARD_URL} pero se terminó en ${currentUrl}`);
    }

    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    await page.waitForSelector(menuTriggerSelector);
    await page.click(menuTriggerSelector);
    
    // Usamos un selector XPath para encontrar el botón por su texto, lo cual es muy fiable.
    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`);
    
    if (!logoutButton) {
      throw new Error('No se encontró el botón de "Cerrar sesión" en el menú.');
    }
    
    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const finalUrl = page.url();
    if (!finalUrl.includes(LOGIN_URL)) {
        throw new Error(`Cierre de sesión fallido. Se esperaba volver a la página de login pero se terminó en ${finalUrl}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Prueba de autenticación (Login y Logout) completada con éxito.'
    });

  } catch (error) {
    console.error('❌ Error en la prueba de autenticación:', error);

    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ path: 'public/error-auth-test.png' });
          console.log('Captura de pantalla del error guardada en public/error-auth-test.png');
        }
      } catch (screenshotError) {
        console.error('No se pudo tomar la captura de pantalla:', screenshotError);
      }
    }

    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}