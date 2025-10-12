import { Page } from 'puppeteer';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

/**
 * Obtiene un usuario aleatorio de la lista definida en las variables de entorno.
 */
function getRandomUser() {
  const usersJson = process.env.TEST_USERS_JSON;
  if (!usersJson) {
    throw new Error('La variable de entorno TEST_USERS_JSON no está definida. Revisa tu archivo .env');
  }

  try {
    const users = JSON.parse(usersJson);
    if (!Array.isArray(users) || users.length === 0) {
      throw new Error('TEST_USERS_JSON no es un array válido o está vacío.');
    }
    const randomIndex = Math.floor(Math.random() * users.length);
    return users[randomIndex];
  } catch (error) {
    throw new Error('Error al parsear TEST_USERS_JSON. Asegúrate de que sea un JSON válido.');
  }
}

/**
 * Realiza el proceso de inicio de sesión con un usuario aleatorio.
 */
export async function login(page: Page) {
  // Obtenemos un usuario al azar en cada llamada
  const user = getRandomUser();
  
  console.log(`🚀 Intentando iniciar sesión como: ${user.code}`);
  
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
  await page.type('#username', user.code); 
  await page.type('#password', user.password); 
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  if (!page.url().startsWith(DASHBOARD_URL)) {
    throw new Error(`El inicio de sesión falló para el usuario ${user.code} o no redirigió al dashboard.`);
  }
  
  console.log(`✅ Sesión iniciada correctamente como ${user.code}.`);
}

/**
 * Realiza el proceso de cierre de sesión.
 */
export async function logout(page: Page) {
  console.log('Cerrando sesión...');
  const menuTriggerSelector = 'button[aria-haspopup="menu"]';
  await page.waitForSelector(menuTriggerSelector);
  await page.click(menuTriggerSelector);

  const logoutXPathSelector = "//button[contains(., 'Logout')]";
  const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`);
  if (!logoutButton) {
    throw new Error('No se pudo encontrar el botón de "Logout".');
  }
  await logoutButton.click();
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log('✅ Sesión cerrada correctamente.');
}