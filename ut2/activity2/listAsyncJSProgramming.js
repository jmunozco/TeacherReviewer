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

const BASE_PATH = 'src';

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

async function listBranchContents(branch, path = '') {
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

async function evaluateFileContent(content) {
  const CRITERIA = [
    {
      name: 'Uso correcto de async/await',
      weight: 2,
      validate: (content) => content.includes('async') && content.includes('await'),
      feedback: 'El código hace uso de async/await correctamente.'
    },
    {
      name: 'Gestión de errores con try/catch',
      weight: 1.5,
      validate: (content) => content.includes('try') && content.includes('catch'),
      feedback: 'Se detecta una adecuada gestión de errores con try/catch.'
    },
    {
      name: 'Uso de Axios',
      weight: 2,
      validate: (content) => content.includes('axios'),
      feedback: 'El código utiliza Axios correctamente para solicitudes HTTP.'
    },
    {
      name: 'Organización del código y comentarios',
      weight: 1.3,
      validate: (content) => content.includes('//') || content.includes('/*'),
      feedback: 'El código está organizado y cuenta con comentarios explicativos.'
    }
  ];

  const results = { criteriaResults: [], totalScore: 0 };
  for (const criterion of CRITERIA) {
    const passed = criterion.validate(content);
    results.criteriaResults.push({
      name: criterion.name,
      passed,
      feedback: passed ? criterion.feedback : `No se cumplió el criterio: ${criterion.name}`,
      weight: passed ? criterion.weight : 0,
    });
    results.totalScore += passed ? criterion.weight : 0;
  }
  return results;
}

async function evaluateBranch(branch) {
  const results = {
    branch: branch,
    criteriaResults: [],
    totalScore: 0,
    documentation: '',
    functionality: ''
  };

  try {
    const files = await listBranchContents(branch, BASE_PATH);
    console.log(`Contenido listado en ${BASE_PATH}:`, files);
    for (const file of files) {
      if (file.type === 'file') {
        console.log(`Evaluando archivo: ${file.path}`);
        const content = await fetchFileContent(branch, file.path);
        if (content) {
          const fileResults = await evaluateFileContent(content);
          results.criteriaResults.push(...fileResults.criteriaResults);
          results.totalScore += fileResults.totalScore;
        }
      } else if (file.type === 'dir') {
        console.log(`Subcarpeta encontrada: ${file.path}`);
        const subFiles = await listBranchContents(branch, file.path);
        for (const subFile of subFiles) {
          const subContent = await fetchFileContent(branch, subFile.path);
          if (subContent) {
            const subFileResults = await evaluateFileContent(subContent);
            results.criteriaResults.push(...subFileResults.criteriaResults);
            results.totalScore += subFileResults.totalScore;
          }
        }
      }
    }

    // Evaluar documentación
    const readmeContent = await fetchFileContent(branch, 'README.md');
    if (readmeContent) {
      results.documentation = readmeContent.includes('Axios') ? 'Documentación menciona Axios.' : 'Documentación incompleta.';
    } else {
      results.documentation = 'No se encontró README.md.';
    }
  } catch (error) {
    results.error = `Error durante la evaluación de la rama ${branch}: ${error.message}`;
  }

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
