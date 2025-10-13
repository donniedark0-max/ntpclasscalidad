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
  if (selector.startsWith('xpath')) {
    const xpathInner = selector.replace(/^xpath\/\/\/??/, '');
    await page.waitForSelector(`xpath/${xpathInner}`, { visible: true });
  const handles = await (page as any).$x(xpathInner);
  if (!handles || handles.length === 0) throw new Error(`No element found for xpath: ${xpathInner}`);
  const el = handles[0];
  // Clear and type using the element handle
  await page.evaluate((e: any) => { (e as HTMLInputElement).value = ''; }, el);
  await (el as any).type(text);
  } else {
    await page.waitForSelector(selector, { visible: true });
    await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLInputElement;
      if (input) input.value = '';
    }, selector);
    await page.type(selector, text);
  }
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
  // Support xpath or css for clickSelector
  if (clickSelector.startsWith('xpath')) {
    const xpathInner = clickSelector.replace(/^xpath\/\/\/??/, '');
  await page.waitForSelector(`xpath/${xpathInner}`, { visible: true });
    await page.evaluate((sel) => {
      const element = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement;
      element?.click();
    }, xpathInner);
  } else {
    await page.waitForSelector(clickSelector, { visible: true });
    await page.click(clickSelector);
  }

  // Wait for the result selector (supports xpath)
  if (waitSelector.startsWith('xpath')) {
    const waitInner = waitSelector.replace(/^xpath\/\/\/??/, '');
  await page.waitForSelector(`xpath/${waitInner}`, { visible: true, timeout: 20000 });
  } else {
    await page.waitForSelector(waitSelector, { visible: true, timeout: 20000 });
  }
}

// Click an Edit button (css or xpath///...) and wait for an input to appear inside the same panel.
// Returns a full XPath string for the found input (without the 'xpath///' prefix).
async function clickEditAndFindInputXPath(page: Page, clickSelector: string, timeout = 10000) {
  console.log(` > clickEditAndFindInputXPath: clicking ${clickSelector} and waiting up to ${timeout}ms for input in the same panel`);

  // First, click the button (supports xpath or css)
  if (clickSelector.startsWith('xpath')) {
    const xpathInner = clickSelector.replace(/^xpath\/\/\/?/, '');
    // Try a robust in-page click using XPath
    const clicked = await page.evaluate((sel) => {
      try {
        const el = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement | null;
        if (!el) return false;
        el.scrollIntoView({ behavior: 'auto', block: 'center' });
        // dispatch synthetic events to better emulate a real user
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        el.click();
        return true;
      } catch (e) { return false; }
    }, xpathInner);
    if (!clicked) {
      // Fallback: find a button with text 'Editar' that's close to a label that contains 'Celular'
      const fallback = await page.evaluate(() => {
        try {
          const buttons = Array.from(document.querySelectorAll('button')) as HTMLElement[];
          for (const btn of buttons) {
            const txt = (btn.textContent || '').trim();
            if (!/editar/i.test(txt)) continue;
            // check proximity: look for a 'p' ancestor sibling with text 'Celular'
            let anc: Element | null = btn.closest('div');
            for (let i = 0; i < 8 && anc; i++) {
              const p = Array.from(anc.querySelectorAll('p')).find(el => (el.textContent || '').trim().toLowerCase() === 'celular');
              if (p) { btn.scrollIntoView({ behavior: 'auto', block: 'center' }); btn.click(); return true; }
              anc = anc.parentElement;
            }
          }
        } catch (e) { }
        return false;
      });
      if (!fallback) {
        throw new Error('Could not click xpath selector or fallback button');
      }
    }
  } else {
    await page.waitForSelector(clickSelector, { visible: true, timeout: 5000 });
    await page.click(clickSelector);
  }

  // Now wait for an input/textarea to appear inside the clicked button's container.
  // We use page.waitForFunction which can return the XPath when found.
  const handle = await page.waitForFunction((sel) => {
    function findButton(selStr: string) {
      try {
        if (selStr.startsWith('xpath')) {
          const x = selStr.replace(/^xpath\/\/\/?/, '');
          return document.evaluate(x, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement | null;
        }
        return document.querySelector(selStr) as HTMLElement | null;
      } catch (e) {
        return null;
      }
    }

    function getXPathForElement(el: Element) {
      if (!el) return null;
      if (el.id) return `//*[@id="${el.id}"]`;
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node.nodeType === Node.ELEMENT_NODE) {
        let index = 1;
        let sibling = node.previousElementSibling;
        while (sibling) { if (sibling.nodeName === node.nodeName) index++; sibling = sibling.previousElementSibling; }
        parts.unshift(node.nodeName.toLowerCase() + (index > 1 ? `[${index}]` : ''));
        node = node.parentElement;
      }
      return '/' + parts.join('/');
    }

    const btn = findButton(sel as string);
    if (!btn) return null;
    // climb up a few levels looking for a container that will host the input
    let node: Element | null = btn.closest('div');
    for (let i = 0; i < 8 && node; i++) {
      const input = node.querySelector('input, textarea, select');
      if (input) {
        const xpath = getXPathForElement(input);
        return xpath; // non-null string signals success
      }
      node = node.parentElement;
    }
    return null;
  }, { timeout, polling: 500 }, clickSelector as any);

  const xpath = await (handle as any).jsonValue();
  if (!xpath) throw new Error('No input appeared in the edit panel after clicking');
  return xpath as string;
}


export async function GET(request: Request) {
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
    // Primero esperamos a que el skeleton/estado de carga desaparezca y que el botón 'Editar' esté habilitado.
    // Esto evita intentar clickear mientras la UI muestra placeholders (animate-pulse) y el botón está deshabilitado.
    try {
      await page.waitForFunction(() => {
        // Buscar el bloque de 'Celular' y el botón dentro.
        const labels = Array.from(document.querySelectorAll('p.font-semibold'));
        const p = labels.find(el => el.textContent && el.textContent.trim() === 'Celular');
        if (!p) return false;
        // Buscar el botón 'Editar' dentro del mismo contenedor
        const container = p.closest('div');
        if (!container) return false;
        const btn = container.querySelector('button');
        if (!btn) return false;
        const disabled = (btn as HTMLButtonElement).disabled;
        const hasLoadingClass = btn.classList.contains('opacity-40') || btn.classList.contains('cursor-not-allowed');
        return !disabled && !hasLoadingClass;
      }, { timeout: 30000 });
      console.log('✅ El botón Editar para Contacto está habilitado y listo.');
    } catch (e) {
      console.log('⚠️ No detectamos el botón Editar habilitado dentro del timeout de 30s, procederemos a probar selectores alternativos de todos modos.');
    }

    // Try several selectors to be resilient to slight DOM differences or localization
    // Prefer stable test ids added to the component; fall back to xpath heuristics
    const possibleFirstEditSelectors = [
      '[data-testid="profile-celular-edit"]',
      "xpath///p[text()='Celular']/ancestor::div[contains(@class, 'justify-between')]//button[text()='Editar']",
      "xpath///p[contains(., 'Celular')]/ancestor::div//button[contains(., 'Editar')]",
      "xpath///button[contains(., 'Editar') and contains(., 'Celular')]",
      "xpath///button[contains(., 'Editar')][1]"
    ];
    const foundEditSel = await waitForAnySelector(page, possibleFirstEditSelectors, { visible: true, timeout: 30000 });
    console.log('✅ Datos del perfil cargados. Selector encontrado:', foundEditSel);

    // If caller requested a preview, take a screenshot now and return it so
    // the caller can inspect the loaded page before any edits.
    try {
      const url = new URL(request.url);
      const previewParam = url.searchParams.get('preview'); // can be 'true', 'after', or null
      if (previewParam) {
        if (previewParam === 'after') {
          // Try to click the edit button (foundEditSel) and then return a screenshot
          try {
            if (foundEditSel.startsWith('xpath')) {
              const inner = foundEditSel.replace(/^xpath\/\/\/?/, '');
              await page.waitForSelector(`xpath/${inner}`, { visible: true, timeout: 3000 });
              await page.evaluate((sel) => { const el = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement; el?.click(); }, inner);
            } else {
              await page.waitForSelector(foundEditSel, { visible: true, timeout: 3000 });
              await page.click(foundEditSel);
            }
            // small delay to let client-side render/hydration happen
            await new Promise((r) => setTimeout(r, 600));
          } catch (e) {
            console.warn('No se pudo clickear el botón Edit antes del preview-after:', e);
          }
          const previewBuffer = await page.screenshot({ type: 'png' });
          try { await page.screenshot({ path: '/tmp/profile_after_edit_click.png' }); } catch(_) {}
          console.log('🔎 Preview-after requested — returning screenshot after click on Edit.');
          return new NextResponse(Buffer.from(previewBuffer as any), { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' } });
        }

        // Default preview (before edits)
        if (previewParam === 'true') {
          const previewBuffer = await page.screenshot({ type: 'png' });
          console.log('🔎 Preview requested — returning screenshot before edits.');
          return new NextResponse(Buffer.from(previewBuffer as any), { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' } });
        }
      } else {
        // Always save intermediate screenshot to /tmp for debugging in Vercel logs
        try {
          await page.screenshot({ path: '/tmp/profile_loaded_preview.png' });
          console.log('📸 Captura intermedia guardada en /tmp/profile_loaded_preview.png');
        } catch (e) {
          // ignore write errors in environments without writable fs
        }
      }
    } catch (e) {
      console.warn('No se pudo generar preview (continuando con la prueba):', e);
    }

    // --- Edición de Contacto ---
    console.log('📝 Editando sección de Contacto...');
    const newPhone = generateRandomPhoneNumber();
    const newEmail = generateRandomEmail();
    
    // -- Editar y Guardar Celular --
    const phoneInputSelector = 'input[aria-label="Celular"]';
    // Wait options after clicking
    const possiblePhoneInputs = [
      '[data-testid="profile-celular-input"]',
      phoneInputSelector,
      "xpath///input[contains(@aria-label, 'Celular')]",
      "xpath///input[contains(@placeholder, 'Celular')]",
    ];

    // First, click Edit and try to obtain the input XPath inside the panel
    let inputSel: string | null = null; // may be a css selector or xpath///...
    try {
      const xpath = await clickEditAndFindInputXPath(page, foundEditSel, 10000);
      console.log('✅ Input XPath encontrado en el panel editado:', xpath);
      inputSel = `xpath///${xpath}`;
      try { await page.screenshot({ path: '/tmp/profile_after_edit_click.png' }); console.log('📸 Captura tras click en Editar guardada en /tmp/profile_after_edit_click.png'); } catch(e){/*ignore*/}
    } catch (err) {
      console.warn('⚠️ clickEditAndFindInputXPath falló (intentaremos click robusto + esperar selectores comunes):', err);
      // Ensure we clicked the Edit button (robust click)
      try {
        if (foundEditSel.startsWith('xpath')) {
          const inner = foundEditSel.replace(/^xpath\/\/\/?/, '');
          await page.evaluate((sel) => { const el = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement; el?.scrollIntoView({behavior:'auto', block:'center'}); el?.click(); }, inner);
        } else {
          await page.waitForSelector(foundEditSel, { visible: true, timeout: 5000 });
          await page.click(foundEditSel);
        }
      } catch (e) {
        console.warn('⚠️ No se pudo clickear el Edit en el fallback:', e);
      }

      // After clicking, wait for one of the known input selectors to appear
      try {
        const sel = await waitForAnySelector(page, possiblePhoneInputs, { visible: true, timeout: 10000 });
        inputSel = sel;
        console.log('✅ Selector de input detectado tras click:', sel);
      } catch (e) {
        console.warn('⚠️ No aparecieron los selectores esperados tras click:', e);
        inputSel = null;
      }
    }

    // If we have an inputSel, write into it properly (supports xpath/// or css)
    if (inputSel) {
      if (inputSel.startsWith('xpath')) {
        await clearAndType(page, inputSel, newPhone);
        // try to click Save relative to xpath
        const xpathInner = inputSel.replace(/^xpath\/\/\/?/, '');
        const saveRelXPath = `xpath///${xpathInner}/ancestor::div[2]//button[text()='Guardar']`;
        try {
          await page.waitForSelector(`xpath/${xpathInner}`, { visible: true, timeout: 2000 });
          await page.evaluate((sel) => { const el = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement; el?.click(); }, saveRelXPath.replace(/^xpath\/\/\/?/, ''));
        } catch (e) {
          try { await page.click("xpath///button[text()='Guardar']"); } catch (_) { /* ignore */ }
        }
      } else {
        // css selector
        await clearAndType(page, inputSel, newPhone);
        try { await page.click('[data-testid="profile-celular-save"]'); } catch (_) {
          try { await page.click("xpath///button[text()='Guardar']"); } catch (_) {}
        }
      }
    } else {
      // Final fallback: use global CSS selector path without prior click
      await clearAndType(page, phoneInputSelector, newPhone).catch(() => {});
      try { await page.click("xpath///button[text()='Guardar']"); } catch (_) { /* ignore */ }
    }

    await page.waitForFunction((phone) => document.body.innerText.includes(phone), {}, newPhone);
    console.log(` > Celular actualizado a ${newPhone}`);
    console.log(` > Celular actualizado a ${newPhone}`);

    // -- Editar y Guardar Correo --
    const editEmailButtonSelector = '[data-testid="profile-correo-edit"]';
    const emailInputSelector = 'input[aria-label="Correo personal"]';
    // Try click-first approach similar to Celular
    let emailInputSel: string | null = null;
    try {
      const xpath = await clickEditAndFindInputXPath(page, editEmailButtonSelector, 10000);
      emailInputSel = `xpath///${xpath}`;
      try { await page.screenshot({ path: '/tmp/profile_after_edit_email_click.png' }); } catch(_){}
    } catch (err) {
      console.warn('⚠️ clickEditAndFindInputXPath for Correo falló, fallback to click + wait selectors:', err);
      try {
        if (editEmailButtonSelector.startsWith('xpath')) {
          const inner = editEmailButtonSelector.replace(/^xpath\/\/\/?/, '');
          await page.evaluate((sel) => { const el = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement; el?.scrollIntoView({behavior:'auto', block:'center'}); el?.click(); }, inner);
        } else {
          await page.waitForSelector(editEmailButtonSelector, { visible: true, timeout: 5000 });
          await page.click(editEmailButtonSelector);
        }
      } catch (e) { console.warn('⚠️ No se pudo clickear el Edit correo en fallback:', e); }

      try {
        const sel = await waitForAnySelector(page, ['[data-testid="profile-correo-input"]', emailInputSelector, "xpath///input[contains(@aria-label,'Correo')]", "xpath///input[contains(@placeholder,'Correo')]"], { visible: true, timeout: 10000 });
        emailInputSel = sel;
      } catch (e) { console.warn('⚠️ No apareció input correo tras click:', e); }
    }

    if (emailInputSel) {
      if (emailInputSel.startsWith('xpath')) {
        await clearAndType(page, emailInputSel, newEmail);
        const xpathInner = emailInputSel.replace(/^xpath\/\/\/?/, '');
        const saveRelXPath = `xpath///${xpathInner}/ancestor::div[2]//button[text()='Guardar']`;
        try { await page.evaluate((sel) => { const el = document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue as HTMLElement; el?.click(); }, saveRelXPath.replace(/^xpath\/\/\/?/, '')); } catch (e) { try { await page.click("xpath///button[text()='Guardar']"); } catch (_) {} }
      } else {
        await clearAndType(page, emailInputSel, newEmail);
        try { await page.click('[data-testid="profile-correo-save"]'); } catch (_) { try { await page.click("xpath///button[text()='Guardar']"); } catch (_) {} }
      }
    } else {
      await clearAndType(page, emailInputSelector, newEmail).catch(() => {});
      try { await page.click("xpath///button[text()='Guardar']"); } catch (_) {}
    }

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