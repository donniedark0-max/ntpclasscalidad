import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import path from 'path';
import { login, logout } from '@/lib/puppeteer-helpers';

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

/**
 * Genera un detalle corto y relevante basado en el tipo de trámite seleccionado.
 * @param tramiteType - El tipo de trámite elegido.
 * @returns Una cadena con el detalle de la solicitud.
 */
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
    // Respuesta por defecto si no coincide ninguna palabra clave
    return "Solicito información y gestión sobre el trámite seleccionado. Quedo a la espera de su respuesta.";
}


export async function GET() {
  console.log('🚀 Iniciando prueba de Solicitudes SAE...');
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 120,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    await login(page);

    await page.goto(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/sae/solicitudes`, { waitUntil: 'networkidle2' });
    console.log('✅ Formulario de Solicitudes SAE cargado.');

    console.log('📝 Llenando el formulario con datos coherentes...');

    // 1. Seleccionar un trámite aleatorio
    const randomTramite = getRandomItem(tramiteTypes);
    await page.select('#tipo', randomTramite);
    console.log(`-> Tipo de trámite: ${randomTramite}`);

    // 2. Generar un detalle relevante para ese trámite
    const relevantDetail = generateRelevantDetail(randomTramite);
    console.log(`-> Detalle generado: "${relevantDetail}"`);
    
    // 3. Llenar el formulario
    await page.type("#telefono", generateRandomPhoneNumber());
    await page.type("#detalle", relevantDetail); 
    await page.click("input[type='checkbox']");

    const fileInput = await page.$('input[type="file"]#sae-file-input');
    if (!fileInput) throw new Error("No se encontró el input para subir archivos.");
    const filePath = path.resolve(process.cwd(), 'public/images/courses/course-3.png');
    await fileInput.uploadFile(filePath);
    console.log('✅ Formulario completado y archivo adjuntado.');

    await page.click("button[type='submit']");
    
    await page.waitForSelector("div[class*='text-green-700']", { timeout: 15000 });
    console.log('✅ ¡Solicitud enviada con éxito!');
    
    await logout(page);

    console.log('🎉 ¡Prueba de Solicitudes SAE completada con éxito!');
    return NextResponse.json({ success: true, message: 'Prueba de solicitud SAE completada correctamente.' });

  } catch (error) {
    console.error('❌ Error en la prueba de Solicitudes SAE:', error);
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: 'public/error-sae-test.png' });
        console.log('📸 Se ha guardado una captura de pantalla del error.');
      }
    }
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}