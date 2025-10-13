import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser, Page } from 'puppeteer';
import path from 'path';

// --- Constantes ---
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;
const CHAT_URL = `${APP_URL}/dashboard/chat`;

export async function GET() {
  const TEST_MESSAGE = `Mensaje de prueba automático enviado a las: ${new Date().toLocaleTimeString()}`;

  console.log('🚀 Iniciando prueba de funcionalidad de chat (flujo completo)...');
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // --- PASO 1: Iniciar Sesión (Sin cambios) ---
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

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`El inicio de sesión falló. URL actual: ${page.url()}`);
    }
    console.log(`✅ Sesión iniciada como ${testUser.code}.`);

    // --- PASO 2: Navegar a la página de Chat (Sin cambios) ---
    console.log('💬 Navegando a la página de chat...');
    const chatLinkSelector = 'a[href*="/dashboard/chat"]';
    await page.waitForSelector(chatLinkSelector);
    await page.click(chatLinkSelector);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(CHAT_URL)) {
        throw new Error(`No se pudo navegar a la página de chat. URL actual: ${page.url()}`);
    }
    console.log('✅ Se encuentra en la página de chat.');

    // --- PASO 3: Iniciar una nueva conversación ---
    console.log('➕ Haciendo clic en "Nuevo" para iniciar una conversación...');
    const newChatButtonXPath = "//button[contains(., 'Nuevo')]";
    const newChatButton = await page.waitForSelector(`xpath/${newChatButtonXPath}`);
    if (!newChatButton) throw new Error("No se encontró el botón '+ Nuevo'.");
    await newChatButton.click();
    console.log('✅ Clic en el botón para un nuevo chat.');

    // --- PASO 4: Seleccionar un usuario de la lista ---
    console.log('👤 Seleccionando un usuario para chatear...');
    await new Promise(r => setTimeout(r, 1000)); 

    const userItemSelector = "xpath///div[contains(., 'Iniciar chat')]//button[1]";
    const firstUserButton = await page.waitForSelector(userItemSelector, { visible: true, timeout: 15000 });
    
    if (!firstUserButton) throw new Error("No se encontró ningún usuario en la lista para iniciar un chat.");
    
    await firstUserButton.click();
    console.log('✅ Se seleccionó el primer usuario de la lista.');
    
    // --- PASO 5: Enviar un mensaje ---
    console.log('✍️ Escribiendo y enviando un mensaje de prueba...');
    
    // CAMBIO 1: Se agregó una pausa para dar tiempo a que la ventana de chat se cargue.
    await new Promise(r => setTimeout(r, 500)); 

    // CAMBIO 2: Se corrigió el selector para buscar un 'input' en lugar de un 'textarea'.
    const messageInputSelector = 'input[placeholder*="Escribe un mensaje"]';
    const sendMessageButtonXPath = "//button[@type='submit']"; 

    await page.waitForSelector(messageInputSelector);
    await page.type(messageInputSelector, TEST_MESSAGE);

    const sendButton = await page.waitForSelector(`xpath/${sendMessageButtonXPath}`);
    if (!sendButton) throw new Error("No se encontró el botón para enviar el mensaje.");
    await sendButton.click();
    console.log('📤 Mensaje enviado.');

    // --- PASO 6: Verificar que el mensaje apareció en la UI ---
    console.log('🔍 Verificando que el mensaje aparece en la pantalla...');
    const sentMessageXPath = `//div[contains(., "${TEST_MESSAGE}")]`; 
    await page.waitForSelector(`xpath/${sentMessageXPath}`, { timeout: 10000 });
    console.log('✅ ¡Mensaje verificado en la UI!');

    // --- PASO 7: Tomar captura de pantalla del éxito ---
    console.log('📸 Tomando captura de pantalla del chat...');
    const screenshotBuffer = await page.screenshot({ type: 'png' });

    console.log('🎉 ¡Prueba de chat finalizada con éxito!');
    const imageBlob = new Blob([new Uint8Array(screenshotBuffer)], { type: 'image/png' });

    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de chat:', error);
    if (page) {
      const isVercel = !!process.env.VERCEL;
      
      const errorPath = (isVercel 
        ? '/tmp/error_chat_screenshot.png' 
        : path.resolve(process.cwd(), 'public/error_chat_screenshot.png')) as `${string}.png`;
      
      await page.screenshot({ path: errorPath });
      console.log(`📸 Captura de error guardada en: ${errorPath}`);
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

