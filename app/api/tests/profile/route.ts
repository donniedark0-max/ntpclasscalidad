import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser, Page } from 'puppeteer';

// --- Constantes y Helpers (sin cambios) ---
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;

function generateRandomPhoneNumber(): string {
  return `9${Math.floor(10000000 + Math.random() * 90000000)}`;
}
function generateRandomEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `test.${randomString}@example.com`;
}
function generateRandomAddress(): string {
  const streets = ["Av. Arequipa", "Calle Las Begonias", "Jirón de la Unión", "Av. Javier Prado"];
  const number = Math.floor(100 + Math.random() * 900);
  return `${streets[Math.floor(Math.random() * streets.length)]} ${number}`;
}
async function clearAndType(page: Page, selector: string, text: string) {
  // La espera ya está garantizada antes de llamar a esta función
  await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLInputElement;
      if (input) input.value = '';
  }, selector);
  await page.type(selector, text);
}

export async function GET() {
  console.log('🚀 Iniciando prueba de perfil (Con Esperas de Resultado)...');
  let browser: Browser | null = null;
  let page: Page | null = null;
  let screenshotBuffer: any = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });

    // --- Login (sin cambios) ---
    console.log('🔑 Autenticando usuario...');
    const usersJson = process.env.TEST_USERS_JSON;
    if (!usersJson) throw new Error('TEST_USERS_JSON no está definido.');
    const users = JSON.parse(usersJson);
    if (users.length === 0) throw new Error('No hay usuarios de prueba.');
    const testUser = users[Math.floor(Math.random() * users.length)];
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    if (!page.url().startsWith(DASHBOARD_URL)) throw new Error(`El inicio de sesión falló.`);
    console.log(`✅ Sesión iniciada como ${testUser.code}.`);

    // --- Navegación y Carga de Página ---
    await page.goto(`${APP_URL}/dashboard/profile`, { waitUntil: 'networkidle2' });
    console.log('✅ Navegado a la página de edición de perfil.');
    console.log('⏳ Esperando a que los datos del perfil carguen...');
    const firstEditButtonSelector = "xpath///p[text()='Celular']/ancestor::div[contains(@class, 'justify-between')]//button[text()='Editar']";
    await page.waitForSelector(firstEditButtonSelector, { visible: true, timeout: 15000 });
    console.log('✅ Datos del perfil cargados.');

    // --- Edición de Contacto ---
    console.log('📝 Editando sección de Contacto...');
    const newPhone = generateRandomPhoneNumber();
    const newEmail = generateRandomEmail();
    
    // -- Editar y Guardar Celular --
    const editPhoneButton = await page.waitForSelector(firstEditButtonSelector);
    if (!editPhoneButton) throw new Error("No se encontró el botón 'Editar' para Celular.");
    await editPhoneButton.click();
    // ⭐ CAMBIO CLAVE: Esperar a que el CAMPO DE TEXTO aparezca DESPUÉS del clic.
    const phoneInputSelector = 'input[aria-label="Celular"]';
    await page.waitForSelector(phoneInputSelector, { visible: true });
    await clearAndType(page, phoneInputSelector, newPhone);
    const savePhoneButton = await page.waitForSelector("xpath///input[@aria-label='Celular']/ancestor::div[2]//button[text()='Guardar']");
    if (!savePhoneButton) throw new Error("No se encontró el botón 'Guardar' para el celular.");
    await savePhoneButton.click();
    await page.waitForFunction((phone) => document.body.innerText.includes(phone), {}, newPhone);
    console.log(` > Celular actualizado a ${newPhone}`);

    // -- Editar y Guardar Correo --
    const editEmailButton = await page.waitForSelector("xpath///p[contains(text(), 'Correo')]/ancestor::div[contains(@class, 'justify-between')]//button[text()='Editar']");
    if (!editEmailButton) throw new Error("No se encontró el botón 'Editar' para Correo.");
    await editEmailButton.click();
    // ⭐ CAMBIO CLAVE: Esperar a que el CAMPO DE TEXTO aparezca DESPUÉS del clic.
    const emailInputSelector = 'input[aria-label="Correo personal"]';
    await page.waitForSelector(emailInputSelector, { visible: true });
    await clearAndType(page, emailInputSelector, newEmail);
    const saveEmailButton = await page.waitForSelector("xpath///input[@aria-label='Correo personal']/ancestor::div[2]//button[text()='Guardar']");
    if (!saveEmailButton) throw new Error("No se encontró el botón 'Guardar' para el correo.");
    await saveEmailButton.click();
    await page.waitForFunction((email) => document.body.innerText.includes(email), {}, newEmail);
    console.log(` > Correo actualizado a ${newEmail}`);
    
    // --- Edición de Nombres y Apellidos ---
    console.log('📝 Editando sección de Nombres y Apellidos...');
    const newName = "TestNombre";
    const newLastName = "TestApellido";
    const editPersonalButton = await page.waitForSelector("xpath///button[text()='Editar Nombres/Apellidos']");
    if (!editPersonalButton) throw new Error("No se encontró el botón 'Editar Nombres/Apellidos'.");
    await editPersonalButton.click();
    // ⭐ CAMBIO CLAVE: Esperar a que el CAMPO DE TEXTO aparezca DESPUÉS del clic.
    const nameInputSelector = 'input[aria-label="Nombres"]';
    await page.waitForSelector(nameInputSelector, { visible: true });
    await clearAndType(page, nameInputSelector, newName);
    await clearAndType(page, 'input[aria-label="Apellidos"]', newLastName);
    const savePersonalButtonSelector = "xpath///p[text()='Nombres']/ancestor::div[contains(@class, 'rounded-lg')]//button[text()='Guardar']";
    const savePersonalButton = await page.waitForSelector(savePersonalButtonSelector);
    if (!savePersonalButton) throw new Error("No se encontró el botón 'Guardar' en la sección personal.");
    await savePersonalButton.click();
    await page.waitForFunction((name) => document.body.innerText.includes(name), {}, newName);
    console.log(` > Nombre actualizado a ${newName} ${newLastName}`);
    
    // --- Edición de Otros Datos ---
    console.log('📝 Editando sección de Otros Datos...');
    const newAddress = generateRandomAddress();
    const editOtherButton = await page.waitForSelector("xpath///p[text()='Estado Civil']/ancestor::div[contains(@class, 'justify-between')]//button[text()='Editar']");
    if (!editOtherButton) throw new Error("No se encontró el botón 'Editar' en otros datos.");
    await editOtherButton.click();
    // ⭐ CAMBIO CLAVE: Esperar a que el CAMPO DE TEXTO aparezca DESPUÉS del clic.
    const addressInputSelector = 'input[aria-label="Dirección"]';
    await page.waitForSelector(addressInputSelector, { visible: true });
    await clearAndType(page, addressInputSelector, newAddress);
    const saveOtherButtonSelector = "xpath///p[text()='Estado Civil']/ancestor::div[contains(@class, 'rounded-lg')]//button[text()='Guardar']";
    const saveOtherButton = await page.waitForSelector(saveOtherButtonSelector);
    if (!saveOtherButton) throw new Error("No se encontró el botón 'Guardar' en otros datos.");
    await saveOtherButton.click();
    await page.waitForFunction((text) => document.body.innerText.includes(text), {}, newAddress);
    console.log(` > Dirección actualizada a "${newAddress}"`);

    // --- Punto de Éxito y Captura ---
    console.log('✅ ¡Perfil actualizado correctamente!');
    console.log('📸 Tomando captura de pantalla final...');
    screenshotBuffer = await page.screenshot({ type: 'png' });
    if (!screenshotBuffer) throw new Error("Se actualizó el perfil, pero no se pudo tomar la captura.");

    console.log('🎉 ¡Prueba de edición de perfil finalizada con éxito!');
    const imageBlob = new Blob([screenshotBuffer], { type: 'png' });
    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de edición de perfil:', error);
    if (page) {
        const isVercel = !!process.env.VERCEL;
        const errorPath = isVercel ? '/tmp/error_profile_screenshot.png' : 'public/error_profile_screenshot.png';
        await page.screenshot({ path: errorPath });
        console.log(`📸 Captura de error guardada en: ${errorPath}`);
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}