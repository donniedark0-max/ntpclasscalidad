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
  await page.waitForSelector(selector, { visible: true });
  await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLInputElement;
      if (input) input.value = '';
  }, selector);
  await page.type(selector, text);
}

// Espera por cualquiera de varios selectores (CSS o xpath///...) con reintentos.
async function waitForAnySelector(page: Page, selectors: string[], opts: {visible?: boolean, timeout?: number} = { visible: true, timeout: 30000 }) {
  const start = Date.now();
  const timeout = opts.timeout ?? 30000;
  const interval = 500;
  while (Date.now() - start < timeout) {
    for (const sel of selectors) {
      try {
        const handle = await page.waitForSelector(sel.startsWith('xpath/') || sel.startsWith('xpath///') ? sel : sel, { visible: !!opts.visible, timeout: 1000 });
        if (handle) return sel;
      } catch (e) {
        // ignore and try next selector
      }
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`None of the selectors became available: ${selectors.join(', ')}`);
}

// ⭐ CAMBIO CLAVE 1: Nueva función de clic ultra-robusta que fuerza el evento en el navegador.
async function forceClickAndWait(page: Page, clickSelector: string, waitSelector: string) {
  console.log(` > Forzando clic en '${clickSelector}' y esperando por '${waitSelector}'...`);
  await page.waitForSelector(clickSelector, { visible: true });
  
  await page.evaluate((sel) => {
    // Esta función se ejecuta DENTRO del navegador.
    const element = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
    element?.click();
  }, clickSelector.replace('xpath///', '')); // Le quitamos el prefijo para usarlo en el navegador

  // Después de forzar el clic, esperamos a que aparezca el resultado.
  await page.waitForSelector(waitSelector, { visible: true, timeout: 20000 });
}


export async function GET() {
  console.log('🚀 Iniciando prueba de perfil (Estrategia de Clic Forzado)...');
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
    console.log('✅ Navegado a la página de perfil.');
    console.log('⏳ Esperando a que los datos del perfil carguen...');
    // Try several selectors to be resilient to slight DOM differences or localization
    const possibleFirstEditSelectors = [
      "xpath///p[text()='Celular']/ancestor::div[contains(@class, 'justify-between')]//button[text()='Editar']",
      "xpath///p[contains(., 'Celular')]/ancestor::div//button[contains(., 'Editar')]",
      "xpath///button[contains(., 'Editar') and contains(., 'Celular')]",
    ];
    const foundEditSel = await waitForAnySelector(page, possibleFirstEditSelectors, { visible: true, timeout: 30000 });
    console.log('✅ Datos del perfil cargados. Selector encontrado:', foundEditSel);

    // --- Edición de Contacto ---
    console.log('📝 Editando sección de Contacto...');
    const newPhone = generateRandomPhoneNumber();
    const newEmail = generateRandomEmail();
    
    // -- Editar y Guardar Celular --
    const phoneInputSelector = 'input[aria-label="Celular"]';
    // Wait for either the standard aria-label input or some alternative selectors
    const possiblePhoneInputs = [
      phoneInputSelector,
      "xpath///input[contains(@aria-label, 'Celular')]",
      "xpath///input[contains(@placeholder, 'Celular')]",
    ];
    const foundPhoneSel = await waitForAnySelector(page, possiblePhoneInputs, { visible: true, timeout: 30000 });
    await forceClickAndWait(page, foundEditSel, foundPhoneSel);
    await clearAndType(page, phoneInputSelector, newPhone);
    await page.click("xpath///input[@aria-label='Celular']/ancestor::div[2]//button[text()='Guardar']");
    await page.waitForFunction((phone) => document.body.innerText.includes(phone), {}, newPhone);
    console.log(` > Celular actualizado a ${newPhone}`);

    // -- Editar y Guardar Correo --
    const editEmailButtonSelector = "xpath///p[contains(text(), 'Correo')]/ancestor::div[contains(@class, 'justify-between')]//button[text()='Editar']";
    const emailInputSelector = 'input[aria-label="Correo personal"]';
    await forceClickAndWait(page, editEmailButtonSelector, emailInputSelector); // ⭐ CAMBIO CLAVE 2
    await clearAndType(page, emailInputSelector, newEmail);
    await page.click("xpath///input[@aria-label='Correo personal']/ancestor::div[2]//button[text()='Guardar']");
    await page.waitForFunction((email) => document.body.innerText.includes(email), {}, newEmail);
    console.log(` > Correo actualizado a ${newEmail}`);
    
    // --- Edición de Nombres y Apellidos ---
    console.log('📝 Editando sección de Nombres y Apellidos...');
    const newName = "TestNombre";
    const newLastName = "TestApellido";
    const editPersonalButtonSelector = "xpath///button[text()='Editar Nombres/Apellidos']";
    const nameInputSelector = 'input[aria-label="Nombres"]';
    await forceClickAndWait(page, editPersonalButtonSelector, nameInputSelector); // ⭐ CAMBIO CLAVE 2
    await clearAndType(page, nameInputSelector, newName);
    await clearAndType(page, 'input[aria-label="Apellidos"]', newLastName);
    const savePersonalButtonSelector = "xpath///p[text()='Nombres']/ancestor::div[contains(@class, 'rounded-lg')]//button[text()='Guardar']";
    await page.click(savePersonalButtonSelector);
    await page.waitForFunction((name) => document.body.innerText.includes(name), {}, newName);
    console.log(` > Nombre actualizado a ${newName} ${newLastName}`);
    
    // --- Edición de Otros Datos ---
    console.log('📝 Editando sección de Otros Datos...');
    const newAddress = generateRandomAddress();
    const editOtherButtonSelector = "xpath///p[text()='Estado Civil']/ancestor::div[contains(@class, 'justify-between')]//button[text()='Editar']";
    const addressInputSelector = 'input[aria-label="Dirección"]';
    await forceClickAndWait(page, editOtherButtonSelector, addressInputSelector); // ⭐ CAMBIO CLAVE 2
    await clearAndType(page, addressInputSelector, newAddress);
    const saveOtherButtonSelector = "xpath///p[text()='Estado Civil']/ancestor::div[contains(@class, 'rounded-lg')]//button[text()='Guardar']";
    await page.click(saveOtherButtonSelector);
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