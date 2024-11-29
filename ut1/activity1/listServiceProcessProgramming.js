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
const PENALTY_PATHS = {
  "src/main/java": 5, // Penalización para la ruta
  "src": 5,
  "src/com/mymodule/serviceprocessprogramming/f1_concurrent_programming/project": 5,
  "src/com/mymodule/serviceprocessprogramming/project": 5
};

// Todas las rutas (incluyendo las principales y las penalizables)
const BASE_PATHS = [
  `src/com/mymodule/serviceprocessprogramming/ut1_concurrent_programming/project`,
  `com/mymodule/serviceprocessprogramming/ut1_concurrent_programming/project`,
  ...Object.keys(PENALTY_PATHS) // Añadir rutas penalizables dinámicamente
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
      return await response.json(); // Devuelve los archivos si la ruta es válida
    }
  } catch (error) {
    console.warn(`No se encontró la ruta: ${path} en la rama ${branch}`);
  }
  return []; // Devuelve una lista vacía si no se encuentra la ruta
}

async function evaluateBranch(branch) {
  const results = {
    branch: branch,
    filesFound: [],
    pathUsed: null, // Ruta válida encontrada
    penalty: 0, // Penalización aplicada
    points: {
      structure: 0,
      executorService: 0,
      tasks: 0,
      threads: 0,
      consoleOutput: 0,
      comparison: 0,
      documentation: 0,
      gitUsage: 0,
    },
  };

  for (const path of BASE_PATHS) {
    const files = await fetchFiles(branch, path);
    if (files.length > 0) {
      results.filesFound = files.map((f) => f.name);
      results.pathUsed = path; // Registrar la ruta usada

      // Aplicar penalización si la ruta está en PENALTY_PATHS
      if (PENALTY_PATHS[path]) {
        results.penalty = PENALTY_PATHS[path];
      }

      totalValidWorks++; // Incrementar el contador al encontrar un trabajo válido
      break; // Detener búsqueda si se encuentra una ruta válida
    }
  }

  if (results.filesFound.length === 0) {
    console.warn(`Advertencia: No se encontraron archivos en la rama ${branch}`);
    return results; // Retorna los resultados con puntajes en 0
  }

  // Validar archivos y estructura
  const expectedFiles = ["TraditionalThreads.java", "VirtualThreads.java", "README.md"];
  expectedFiles.forEach((file) => {
    if (results.filesFound.includes(file)) {
      results.points.structure += 2; // 2 puntos por archivo correcto
    }
  });

  // Verificar README.md para capturas y gráficos
  if (results.filesFound.includes("README.md")) {
    results.points.documentation += 10;
  }

  // Agregar puntos por ramas correctas
  if (branch.startsWith("feature/ev1")) {
    results.points.gitUsage += 10;
  }

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

  console.log("\nResultados de la Evaluación:\n");
  results.forEach((result) => {
    console.log(`Rama: ${result.branch}`);
    console.log(`Archivos encontrados: ${result.filesFound.join(", ")}`);
    console.log(`Ruta utilizada: ${result.pathUsed || "No encontrada"}`);
    console.log(`Penalización aplicada: ${result.penalty}`);
    console.log(`Puntajes:`, result.points);
    console.log("\n");
  });

  // Mostrar el total de trabajos válidos encontrados
  console.log(`Total de trabajos válidos encontrados: ${totalValidWorks}`);

  // Guardar resultados en un archivo JSON
  fs.writeFileSync("evaluation_results.json", JSON.stringify(results, null, 2));
  console.log("Resultados guardados en evaluation_results.json");
}


evaluateAllBranches();
