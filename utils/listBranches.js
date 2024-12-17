import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
const projectRoot = path.resolve(__dirname, '../');
const envPath = path.join(projectRoot, '.env');
const envLocalPath = path.join(projectRoot, '.env.local');

if (fs.existsSync(envPath)) {
  console.log(`Cargando archivo .env desde ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`Archivo .env no encontrado en ${envPath}`);
}

if (fs.existsSync(envLocalPath)) {
  console.log(`Cargando archivo .env.local desde ${envLocalPath}`);
  dotenv.config({ path: envLocalPath, override: true });
} else {
  console.warn(`Archivo .env.local no encontrado en ${envLocalPath}`);
}

// Configuración
const TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "jmunozco";
const REPO_NAME = "ServiceProcessProgramming";
const USERNAME = "jmunozco"; // Reemplaza con tu nombre de usuario de GitHub

// Verificar que el token esté cargado
if (!TOKEN) {
  console.error("El token de GitHub no está configurado. Asegúrate de que el archivo .env o .env.local contiene GITHUB_TOKEN.");
  process.exit(1);
}

// Obtener la ruta de la subcarpeta desde los argumentos de línea de comandos
const subfolderPath = process.argv[2];
if (!subfolderPath) {
  console.error("Por favor, proporciona la ruta de la subcarpeta como argumento.");
  process.exit(1);
}

// Función para obtener las ramas de un repositorio en GitHub
async function fetchBranches() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches`;
  const options = {
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "node.js",
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error al obtener ramas: ${response.statusText}`);
    const branches = await response.json();
    const featureBranches = branches.filter(branch => branch.name.startsWith('feature/'));
    for (const branch of featureBranches) {
      console.log(`Rama: ${branch.name}`);
      await listFilesInSubfolder(branch.name, subfolderPath);
    }
  } catch (error) {
    console.error("Error al obtener ramas:", error);
  }
}

// Función para listar archivos en una subcarpeta específica de una rama
async function listFilesInSubfolder(branch, subfolderPath) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${subfolderPath}?ref=${branch}`;
  const options = {
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "node.js",
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error al obtener archivos de la subcarpeta: ${response.statusText}`);
    const files = await response.json();
    files.forEach(file => {
      console.log(`  - ${file.name}`);
    });
  } catch (error) {
    console.error(`Error al listar archivos en la subcarpeta para la rama ${branch}:`, error);
  }
}

// Ejecutar la función para obtener y mostrar las ramas y archivos en la subcarpeta
fetchBranches();