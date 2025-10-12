// D:\UTP-Class Guardian\ntpclasscalidad\app\api\tests\exam\route.ts

import { NextResponse } from 'next/server';
import { getBrowser } from '../../../../lib/puppeteer-browser';
import { Browser, Page } from 'puppeteer';
import path from 'path';

// --- Constantes de la prueba ---
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const LOGIN_URL = `${APP_URL}/`;
const DASHBOARD_URL = `${APP_URL}/dashboard`;
const COURSE_NAME = 'Calidad de Software';
const WEEK_TO_TEST = 'Semana 1';
const TEST_EXAM_ID = 'exam-week-1';
const EXAM_LINK_TEXT = 'Examen Semana 1';
const PREDETERMINED_TEXT_ANSWER = "Respuesta de prueba automatizada para la pregunta abierta.";

// Función auxiliar (sin cambios)
function getRandomOption<T>(options: T[]): T | undefined {
  if (options.length === 0) return undefined;
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

export async function GET() {
  console.log('🚀 Iniciando prueba de examen (Manejo de Checkboxes añadido)...');
  let browser: Browser | null = null;
  let page: Page | null = null;
  let screenshotBuffer: any = null;

  try {
    browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // --- Lógica de Login ---
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

    // --- Navegación hasta el examen ---
    console.log(`Buscando el curso "${COURSE_NAME}"...`);
    const courseCardXPath = `//a[.//h3[contains(., '${COURSE_NAME}')]]`;
    const courseCard = await page.waitForSelector(`xpath/${courseCardXPath}`);
    if (!courseCard) throw new Error(`No se encontró el curso "${COURSE_NAME}"`);
    await courseCard.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    console.log(`Buscando la sección "${WEEK_TO_TEST}"...`);
    const weekXPath = `//button[contains(., '${WEEK_TO_TEST}')]`;
    const weekElement = await page.waitForSelector(`xpath/${weekXPath}`);
    if (!weekElement) throw new Error(`No se encontró la sección "${WEEK_TO_TEST}"`);
    await weekElement.click();
    
    console.log(`Buscando el enlace del examen "${EXAM_LINK_TEXT}"...`);
    const examLinkXPath = `//a[contains(@href, "/exam/${TEST_EXAM_ID}") and contains(., "${EXAM_LINK_TEXT}")]`;
    const examLink = await page.waitForSelector(`xpath/${examLinkXPath}`);
    if (!examLink) throw new Error(`No se encontró el enlace al examen "${EXAM_LINK_TEXT}"`);
    await examLink.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // --- Lógica para resolver el examen ---
    console.log('📝 Respondiendo el examen...');
    const questions = await page.$$('div.rounded-lg.bg-white.p-6.shadow-sm div:has(h3)');
    console.log(`🔎 Se encontraron ${questions.length} preguntas.`);

    for (const question of questions) {
        // 1. Responder opción única (Radio buttons)
        const radioOptions = await question.$$('input[type="radio"]');
        if (radioOptions.length > 0) {
            const randomOption = getRandomOption(radioOptions);
            if (randomOption) await randomOption.click();
            continue; // Pasa a la siguiente pregunta
        }

        // ⭐ CAMBIO: Lógica añadida para responder selección múltiple (Checkboxes)
        const checkboxOptions = await question.$$('input[type="checkbox"]');
        if (checkboxOptions.length > 0) {
            // Para cumplir la validación, seleccionamos al menos una opción al azar.
            const randomCheckbox = getRandomOption(checkboxOptions);
            if (randomCheckbox) await randomCheckbox.click();
            continue; // Pasa a la siguiente pregunta
        }

        // 3. Responder pregunta de texto y adjuntar archivo
        const textArea = await question.$('textarea');
        if (textArea) {
            await textArea.type(PREDETERMINED_TEXT_ANSWER);
            const fileInput = await question.$('input[type="file"]');
            if (fileInput) {
                console.log('... Adjuntando archivo opcional...');
                const filePath = path.resolve(process.cwd(), 'public/error-exam-test.png');
                await fileInput.uploadFile(filePath);
                console.log('   ✅ Archivo adjuntado.');
            }
        }
    }
    
    // --- Envío y Verificación ---
    const submitButtonXPath = "//button[contains(., 'Enviar examen')]";
    const submitButton = await page.waitForSelector(`xpath/${submitButtonXPath}`);
    if (!submitButton) throw new Error("No se encontró el botón 'Enviar examen'");
    await submitButton.click();
    
    const confirmationTextSelector = `//h2[contains(., 'Examen en revisión')]`;
    await page.waitForSelector(`xpath/${confirmationTextSelector}`, { timeout: 15000 });
    console.log('✅ ¡Examen enviado! Pantalla de confirmación encontrada.');
    
    // --- Captura de pantalla y Cierre de sesión ---
    console.log('📸 Tomando captura de pantalla de la confirmación...');
    screenshotBuffer = await page.screenshot({ type: 'png' });
    
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2' });
    await page.click('button[aria-haspopup="menu"]');
    const logoutButton = await page.waitForSelector(`xpath///button[contains(., 'Cerrar sesión')]`, { visible: true });
    if (!logoutButton) throw new Error('El botón de logout no apareció.');
    await logoutButton.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Cierre de sesión exitoso.');
    
    if (!screenshotBuffer) throw new Error("No se pudo tomar la captura.");

    // Devolver la imagen
    console.log('🎉 ¡Prueba de ciclo completo de examen finalizada!');
    const imageBlob = new Blob([screenshotBuffer], { type: 'png' });
    return new NextResponse(imageBlob, {
        status: 200,
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' },
    });

  } catch (error) {
    console.error('❌ Error en la prueba de resolución de examen:', error);
    if (page) {
        const isVercel = !!process.env.VERCEL;
        const errorPath = isVercel ? '/tmp/error_exam_screenshot.png' : 'public/error_exam_screenshot.png';
        await page.screenshot({ path: errorPath });
        console.log(`📸 Captura de error guardada en: ${errorPath}`);
    }
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}