import { Page } from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

/**
 * Realiza el proceso de inicio de sesión.
 */
export async function login(page: Page) {
  console.log('Iniciando sesión...');
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
  await page.type('#username', process.env.TEST_USER_CODE!);
  await page.type('#password', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  if (!page.url().startsWith(DASHBOARD_URL)) {
    throw new Error('El inicio de sesión falló o no redirigió al dashboard.');
  }
  console.log('✅ Sesión iniciada correctamente.');
}

/**
 * Realiza el proceso de cierre de sesión.
 */
export async function logout(page: Page) {
  console.log('Cerrando sesión...');
  const menuTriggerSelector = 'button[aria-haspopup="menu"]';
  await page.waitForSelector(menuTriggerSelector);
  await page.click(menuTriggerSelector);

  const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
  const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`);
  if (!logoutButton) {
      throw new Error('No se pudo encontrar el botón de "Cerrar sesión".');
  }
  await logoutButton.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('✅ Sesión cerrada correctamente.');
}