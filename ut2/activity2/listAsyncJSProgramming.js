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

// Limpiar valores de las variables de entorno
const TOKEN = process.env.GITHUB_TOKEN?.trim();
const REPO_OWNER = process.env.REPO_OWNER?.replace(/"|;/g, '').trim();
const REPO_NAME = process.env.REPO_NAME?.replace(/"|;/g, '').trim();

console.log(`Valores cargados: TOKEN=${TOKEN}, REPO_OWNER=${REPO_OWNER}, REPO_NAME=${REPO_NAME}`);

const BASE_PATH = 'src/com/mymodule/serviceprocessprogramming/ut2_multiprocess_programming/project/ex2';

async function fetchBranches() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/branches`;
  console.log(`URL para obtener ramas: ${url}`);
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
    console.log(`Ramas obtenidas:`, branches.map(branch => branch.name));
    return branches;
  } catch (error) {
    console.error("Error al obtener ramas:", error);
    return [];
  }
}

async function listBranchContents(branch, path) {
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
      const data = await response.json();
      return data;
    } else {
      console.warn(`Error al listar contenido de la rama ${branch} en ${path}: ${response.statusText}`);
    }
  } catch (error) {
    console.warn(`Error al listar contenido de la rama ${branch} en ${path}:`, error);
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

async function evaluateFileContent(content, fileName) {
  const CRITERIA = [
    {
      name: 'Uso correcto de async/await',
      weight: 2.5,
      validate: (content) => {
        const hasAsyncAwait = content.includes('async') && content.includes('await');
        const hasThenCatch = content.includes('.then') && content.includes('.catch');
        if (hasAsyncAwait) return 2.5;
        if (hasThenCatch) return 1.5;
        return 0;
      },
      feedback: 'El código hace uso de async/await o .then/.catch correctamente.'
    },
    {
      name: 'Gestión de errores con try/catch',
      weight: 2,
      validate: (content) => {
        const hasTryCatch = content.includes('try') && content.includes('catch');
        const hasCatchOnly = content.includes('.catch');
        if (hasTryCatch) return 2;
        if (hasCatchOnly) return 1;
        return 0;
      },
      feedback: 'Se detecta una adecuada gestión de errores con try/catch o .catch.'
    },
    {
      name: 'Uso de Axios',
      weight: 2,
      validate: (content) => {
        const hasAxios = content.includes('axios');
        return hasAxios ? 2 : 0;
      },
      feedback: 'El código utiliza Axios correctamente para solicitudes HTTP.'
    },
    {
      name: 'Organización del código y comentarios',
      weight: 1.5,
      validate: (content) => {
        const hasComments = content.includes('//') || content.includes('/*');
        const wellOrganized = content.includes('function') || content.includes('class');
        if (hasComments && wellOrganized) return 1.5;
        if (hasComments || wellOrganized) return 1;
        return 0;
      },
      feedback: 'El código está organizado y cuenta con comentarios explicativos.'
    },
    {
      name: 'Documentación',
      weight: 2,
      validate: (readmeContent) => {
        if (!readmeContent) return 0;
        let score = 1;
        if (readmeContent.includes('Axios')) score += 1;
        return score;
      },
      feedback: 'Documentación encontrada y evaluada correctamente.'
    }
  ];

  const results = { fileName, criteriaResults: [], totalScore: 0 };
  for (const criterion of CRITERIA) {
    const score = criterion.validate(content);
    results.criteriaResults.push({
      name: criterion.name,
      feedback: score > 0 ? criterion.feedback : `No se cumplió el criterio: ${criterion.name}`,
      weight: score,
    });
    results.totalScore += score;
  }
  return results;
}

async function evaluateBranch(branch) {
  const results = {
    branch: branch,
    filesFound: [],
    filesEvaluated: [],
    fileList: [],
    comments: new Set(),
    points: {},
    totalPoints: 0
  };

  try {
    const files = await listBranchContents(branch, BASE_PATH);
    console.log(`Contenido listado en ${BASE_PATH}:`, files);
    for (const file of files) {
      if (file.type === 'file') {
        results.filesFound.push(file.name);
        results.fileList.push({ name: file.name, path: file.path });
        console.log(`Evaluando archivo: ${file.path}`);
        const content = await fetchFileContent(branch, file.path);
        if (content) {
          results.filesEvaluated.push(file.name);
          const fileResults = await evaluateFileContent(content, file.name);
          fileResults.criteriaResults.forEach(cr => {
            if (!results.points[cr.name] || results.points[cr.name] < cr.weight) {
              results.comments.add(cr.feedback);
              results.points[cr.name] = cr.weight;
            }
          });
          results.totalPoints += fileResults.totalScore;
        }
      } else if (file.type === 'dir') {
        console.log(`Subcarpeta encontrada: ${file.path}`);
        const subFiles = await listBranchContents(branch, file.path);
        for (const subFile of subFiles) {
          results.filesFound.push(subFile.name);
          results.fileList.push({ name: subFile.name, path: subFile.path });
          const subContent = await fetchFileContent(branch, subFile.path);
          if (subContent) {
            results.filesEvaluated.push(subFile.name);
            const subFileResults = await evaluateFileContent(subContent, subFile.name);
            subFileResults.criteriaResults.forEach(cr => {
              if (!results.points[cr.name] || results.points[cr.name] < cr.weight) {
                results.comments.add(cr.feedback);
                results.points[cr.name] = cr.weight;
              }
            });
            results.totalPoints += subFileResults.totalScore;
          } else {
            results.comments.add(`No se pudo leer el archivo: ${subFile.path}`);
          }
        }
      }
    }

    const readmeContent = await fetchFileContent(branch, 'README.md');
    if (readmeContent) {
      results.comments.add('Documentación encontrada en README.md.');
      const docScore = readmeContent.includes('Axios') ? 2 : 1;
      results.comments.add(docScore > 1 ? 'Documentación menciona Axios.' : 'Documentación básica encontrada.');
      results.points['Documentación'] = docScore;
    } else {
      results.comments.add('No se encontró README.md.');
    }

    // Calcular el total de puntos
    results.totalPoints = Object.values(results.points).reduce((acc, curr) => acc + curr, 0);

  } catch (error) {
    results.comments.add(`Error durante la evaluación de la rama ${branch}: ${error.message}`);
  }

  results.comments = Array.from(results.comments);
  return results;
}

async function evaluateAllBranches() {
  const branches = await fetchBranches();
  const results = [];

  for (const branch of branches) {
    if (branch.name.startsWith("feature/ev1")) {
      console.log(`Evaluando la rama: ${branch.name}`);
      const result = await evaluateBranch(branch.name);
      results.push(result);
    }
  }

  const outputPath = path.join(__dirname, "activity2_evaluation_results.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Resultados guardados en ${outputPath}`);
}

evaluateAllBranches();
