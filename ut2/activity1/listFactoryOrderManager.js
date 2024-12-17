import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const projectRoot = path.resolve(__dirname, '../../');
const envLocalPath = path.join(projectRoot, '.env.local');
const envPath = path.join(projectRoot, '.env');

if (!fs.existsSync(envPath)) {
  console.warn(`Archivo .env no encontrado en ${envPath}`);
} else {
  console.log(`Cargando archivo .env desde ${envPath}`);
}

if (!fs.existsSync(envLocalPath)) {
  console.warn(`Archivo .env.local no encontrado en ${envLocalPath}`);
} else {
  console.log(`Cargando archivo .env.local desde ${envLocalPath}`);
}

dotenv.config({ path: envPath });
dotenv.config({ path: envLocalPath, override: true });

// Configuración
const TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "jmunozco";
const REPO_NAME = "ServiceProcessProgramming";

// Función para buscar archivos recursivamente
async function fetchAllFiles(branch, currentPath) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${currentPath}?ref=${branch}`;
  const options = {
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "node.js",
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.warn(`No se pudo acceder al contenido de ${url}: ${response.statusText}`);
      return [];
    }
    const files = await response.json();
    let allFiles = [];
    for (const file of files) {
      if (file.type === "file" && file.name === "pedidos.txt") {
        allFiles.push(file.path);
      } else if (file.type === "dir") {
        const subFiles = await fetchAllFiles(branch, file.path);
        allFiles = allFiles.concat(subFiles);
      }
    }
    return allFiles;
  } catch (error) {
    console.error(`Error al acceder a ${url}:`, error);
    return [];
  }
}

// Función para evaluar ramas
async function evaluateBranch(branch) {
  const results = {
    branch: branch,
    filesFound: [],
    comments: [],
    points: {
      readOrders: 0,
      processBuilder: 0,
      ioStreams: 0,
      logs: 0,
      organization: 0,
    },
    totalPoints: 0,
  };

  // Buscar pedidos.txt en cualquier subcarpeta
  const pedidosFiles = await fetchAllFiles(branch, "");
  if (pedidosFiles.length > 0) {
    results.points.readOrders = 2;
    results.comments.push(`Se encontró el archivo pedidos.txt en las siguientes ubicaciones: ${pedidosFiles.join(", ")}.`);
  } else {
    results.comments.push("No se encontró el archivo pedidos.txt en el repositorio.");
  }

  // Evaluar uso de ProcessBuilder
  if (pedidosFiles.length > 0) {
    for (const filePath of pedidosFiles) {
      const content = await fetchFileContent(branch, filePath);
      if (content && content.includes("ProcessBuilder")) {
        results.points.processBuilder = 2;
        results.comments.push(`Se detectó el uso de ProcessBuilder en ${filePath}.`);
        break;
      }
    }
  }

  // Evaluar organización y documentación
  const readmePath = `README.md`;
  const readmeContent = await fetchFileContent(branch, readmePath);
  if (readmeContent) {
    results.points.organization = 1.7;
    results.comments.push("El archivo README.md está presente y documenta el proyecto.");
  } else {
    results.comments.push("No se encontró el archivo README.md.");
  }

  results.totalPoints = Object.values(results.points).reduce((sum, val) => sum + val, 0);

  return results;
}

// Función para obtener contenido de un archivo
async function fetchFileContent(branch, filePath) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}?ref=${branch}`;
  const options = {
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "node.js",
    },
  };

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.json();
      if (!data.content) {
        console.warn(`El archivo ${filePath} no contiene contenido legible.`);
        return null;
      }
      return Buffer.from(data.content, "base64").toString("utf-8");
    } else {
      console.warn(`No se pudo obtener el contenido del archivo ${filePath}: ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`Error al obtener el contenido del archivo ${filePath}:`, error);
  }
  return null;
}

// Función para obtener todas las ramas
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
    return await response.json();
  } catch (error) {
    console.error("Error al obtener ramas:", error);
    return [];
  }
}

// Función principal para evaluar todas las ramas
async function evaluateAllBranches() {
  const branches = await fetchBranches();
  const results = [];

  for (const branch of branches) {
    if (branch.name.startsWith("feature/ev1")) {
      console.log(`Evaluando la rama: ${branch.name}`);
      try {
        const branchResults = await evaluateBranch(branch.name);
        results.push(branchResults);
      } catch (error) {
        console.error(`Error al evaluar la rama ${branch.name}:`, error);
      }
    }
  }

  const outputPath = path.join(__dirname, "activity1_evaluation_results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Resultados guardados en ${outputPath}`);
}

// Ejecutar evaluación directamente desde la terminal
evaluateAllBranches();
