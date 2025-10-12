import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser } from 'puppeteer';
import path from 'path';

// --- Constantes de URLs para la prueba ---
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;
const SAE_URL = `${APP_URL}/dashboard/sae/solicitudes`;

// --- Datos y Funciones para la Prueba ---
const tramiteTypes = [
    "Ampliación de vigencia/Cambio de título (Tesis o Trabajo de Suficiencia Profesional)",
    "Aprobación Plan Tesis o Trabajo Suficiencia Profesional",
    "Autenticación de Documentos",
    "Autenticación de Sílabo",
    "Beca Cultura",
    "Beca Excelencia Deportiva",
    "Beca Madre de Dios",
    "Beca por Orfandad/Por Discapacidad",
    "Beca Programa Deportivo Alta Competencia PRODAC",
    "Beca Pronabec",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomPhoneNumber(): string {
  return `9${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function generateRelevantDetail(tramiteType: string): string {
    const lowerCaseType = tramiteType.toLowerCase();
    if (lowerCaseType.includes('tesis')) {
        return "Solicito la revisión y aprobación de mi plan de tesis para poder continuar con el desarrollo.";
    }
    if (lowerCaseType.includes('beca')) {
        return "Deseo postular a la beca mencionada. Adjunto la documentación necesaria para la evaluación.";
    }
    if (lowerCaseType.includes('autenticación')) {
        return "Requiero la autenticación del documento adjunto para realizar trámites administrativos externos.";
    }
    if (lowerCaseType.includes('ampliación')) {
        return "Solicito una ampliación de vigencia para culminar mi trabajo de suficiencia profesional.";
    }
    return "Solicito información y gestión sobre el trámite seleccionado. Quedo a la espera de su respuesta.";
}

export async function GET() {
  console.log('🚀 Iniciando prueba de Solicitudes SAE...');
  let browser: Browser | null = null;
  let page: any = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    // --- 1. INICIO DE SESIÓN ---
    const usersJson = process.env.TEST_USERS_JSON;
    if (!usersJson) throw new Error('La variable de entorno TEST_USERS_JSON no está definida.');
    const users = JSON.parse(usersJson);
    if (users.length === 0) throw new Error('No se encontraron usuarios de prueba.');
    const testUser = users[Math.floor(Math.random() * users.length)];

    await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
    await page.type('#username', testUser.code);
    await page.type('#password', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(DASHBOARD_URL)) {
      throw new Error(`El inicio de sesión falló. URL actual: ${page.url()}`);
    }
    console.log('✅ Inicio de sesión exitoso.');

    // --- 2. NAVEGAR Y LLENAR FORMULARIO SAE ---
    await page.goto(SAE_URL, { waitUntil: 'networkidle2' });
    console.log('✅ Formulario de Solicitudes SAE cargado.');

    console.log('📝 Llenando el formulario con datos coherentes...');
    const randomTramite = getRandomItem(tramiteTypes);
    await page.select('#tipo', randomTramite);
    console.log(`-> Tipo de trámite seleccionado: ${randomTramite}`);

    const relevantDetail = generateRelevantDetail(randomTramite);
    await page.type("#detalle", relevantDetail);
    console.log(`-> Detalle generado: "${relevantDetail}"`);
    
    await page.type("#telefono", generateRandomPhoneNumber());
    await page.click("input[type='checkbox']");

    const fileInput = await page.$('input[type="file"]#sae-file-input');
    if (!fileInput) throw new Error("No se encontró el input para subir archivos.");
    const filePath = path.resolve(process.cwd(), 'public/images/courses/course-3.png');
    await fileInput.uploadFile(filePath);
    console.log('✅ Formulario completado y archivo adjuntado.');

    // --- 3. ENVIAR FORMULARIO Y VERIFICAR ÉXITO ---
    await page.click("button[type='submit']");
    await page.waitForSelector("div[class*='text-green-700']", { timeout: 15000 });
    console.log('✅ ¡Solicitud enviada con éxito!');
    
    // --- 4. TOMAR CAPTURA DE PANTALLA (CON EL TICKET VISIBLE) ---
    console.log('📸 Tomando captura de pantalla con el ticket de confirmación...');
    const screenshotBuffer = await page.screenshot({ type: 'png' });

    // --- 5. CERRAR SESIÓN ---
    const menuTriggerSelector = 'button[aria-haspopup="menu"]';
    console.log('🔍 Buscando el menú de usuario para cerrar sesión...');
    await page.click(menuTriggerSelector);
    
    const logoutXPathSelector = "//button[contains(., 'Cerrar sesión')]";
    console.log('⏳ Esperando que aparezca el botón "Cerrar sesión"...');
    const logoutButton = await page.waitForSelector(`xpath/${logoutXPathSelector}`, { visible: true, timeout: 10000 });
    
    if (!logoutButton) throw new Error('El botón de logout nunca apareció en el menú.');

    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    if (!page.url().startsWith(LOGIN_URL)) {
      throw new Error(`El cierre de sesión falló. La URL final es: ${page.url()}`);
    }
    console.log('✅ Cierre de sesión exitoso.');
    console.log('🎉 ¡Prueba de ciclo completo de SAE finalizada!');

    // --- 6. DEVOLVER LA CAPTURA DE PANTALLA ---
    const imageBlob = new Blob([new Uint8Array(screenshotBuffer)], { type: 'image/png' });

    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de Solicitudes SAE:', error);
    if (page) {
      // Guardar en /tmp para compatibilidad con Vercel
      await page.screenshot({ path: '/tmp/error_sae_screenshot.png' });
      console.log('📸 Captura de pantalla del error guardada en /tmp.');
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}