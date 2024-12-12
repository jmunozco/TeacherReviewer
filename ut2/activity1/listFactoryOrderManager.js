import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

// Configuración
const TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "jmunozco";
const REPO_NAME = "ServiceProcessProgramming";

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

let totalValidWorks = 0; // Contador global para los trabajos encontrados
const BASE_PATHS = [
  `src/com/mymodule/serviceprocessprogramming/ut2_multiprocess_programming/project/ex1`,
  `src/com/mymodule/serviceprocessprogramming/ut2_multiprocess_programming/project/ex2`
];

async function fetchFiles(branch, path) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${branch}`;
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
      return await response.json();
    } else {
      console.warn(`No se pudieron obtener archivos de la URL ${url}: ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`Error al obtener archivos de ${url}:`, error);
  }
  return [];
}

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
      return Buffer.from(data.content, "base64").toString("utf-8");
    } else {
      console.warn(`No se pudo obtener el contenido del archivo ${filePath}: ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`Error al obtener el contenido del archivo ${filePath}:`, error);
  }
  return null;
}

async function analyzeIOStreams(content) {
  // Comprobar si las palabras clave necesarias están presentes
  const hasInputStreams = content.includes("BufferedReader") || content.includes("InputStreamReader");
  const hasOutputStreams = content.includes("BufferedWriter") || content.includes("OutputStreamWriter");

  // Verificar si están usados correctamente en un contexto funcional
  const isInputUsed = content.match(/BufferedReader\s*\(.*?\)/) || content.match(/InputStreamReader\s*\(.*?\)/);
  const isOutputUsed = content.match(/BufferedWriter\s*\(.*?\)/) || content.match(/OutputStreamWriter\s*\(.*?\)/);

  return hasInputStreams && hasOutputStreams && isInputUsed && isOutputUsed;
}

async function evaluateBranch(branch) {
  const results = {
    branch: branch,
    filesFound: [],
    fileList: [],
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

  for (const path of BASE_PATHS) {
    const files = await fetchFiles(branch, path);
    if (files.length > 0) {
      results.filesFound = files.map((f) => f.name);
      results.fileList = files.map((f) => ({ name: f.name, path: f.path }));
      break;
    }
  }

  if (results.filesFound.length === 0) {
    results.comments.push("No se encontraron archivos en las ubicaciones especificadas. Asegúrate de seguir las instrucciones de entrega correctamente.");
    return results;
  }

  // Evaluar lectura de pedidos.txt
  if (results.filesFound.includes("pedidos.txt")) {
    results.points.readOrders = 2;
    results.comments.push("Se encontró el archivo pedidos.txt y parece estar correctamente leído.");
  } else {
    results.comments.push("No se encontró el archivo pedidos.txt.");
  }

  // Evaluar uso de ProcessBuilder
  for (const file of results.fileList) {
    const content = await fetchFileContent(branch, file.path);
    if (content && content.includes("ProcessBuilder")) {
      results.points.processBuilder = 2;
      results.comments.push(`Se detectó el uso de ProcessBuilder en el archivo ${file.name}.`);
      break;
    }
  }

  // Evaluar flujos de comunicación I/O
  for (const file of results.fileList) {
    const content = await fetchFileContent(branch, file.path);
    if (content && (await analyzeIOStreams(content))) {
      results.points.ioStreams = 2;
      results.comments.push(`Se detectaron flujos de comunicación I/O correctamente implementados en el archivo ${file.name}.`);
      break;
    }
  }

  // Evaluar generación de logs
  const logFiles = results.filesFound.filter((f) => f.startsWith("log_pedido_"));
  if (logFiles.length > 0) {
    results.points.logs = Math.min(2, logFiles.length * 0.5);
    results.comments.push(`Se generaron ${logFiles.length} archivos de log.`);
  } else {
    results.comments.push("No se encontraron archivos de log.");
  }

  // Evaluar organización y documentación
  if (results.filesFound.includes("README.md")) {
    results.points.organization = 1.7;
    results.comments.push("El archivo README.md está presente y documenta el proyecto.");
  } else {
    results.comments.push("No se encontró el archivo README.md.");
  }

  results.totalPoints = Object.values(results.points).reduce((sum, val) => sum + val, 0);

  return results;
}

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

  fs.writeFileSync("evaluation_results.json", JSON.stringify(results, null, 2));
  console.log("Resultados guardados en evaluation_results.json");
}

// Ejecutar evaluación directamente desde la terminal
evaluateAllBranches();