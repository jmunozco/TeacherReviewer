import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

// Configuración
const TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "jmunozco";
const REPO_NAME = "ServiceProcessProgramming";

const BASE_PATHS = [
  `src/com/mymodule/serviceprocessprogramming/ut1_concurrent_programming/project`,
  `com/mymodule/serviceprocessprogramming/ut1_concurrent_programming/project`
];

const EXPECTED_FILES = ["TraditionalThreads.java", "VirtualThreads.java", "README.md"];
const CRITERIA = [
  { id: 'executorService', description: 'Configuración correcta del ExecutorService', maxPoints: 10 },
  { id: 'customTasks', description: 'Implementación correcta de tareas personalizadas', maxPoints: 10 },
  { id: 'threadTypes', description: 'Uso de hilos tradicionales y virtuales', maxPoints: 10 },
  { id: 'consoleOutput', description: 'Salida en consola completa y clara', maxPoints: 10 },
  { id: 'comparisonAnalysis', description: 'Gráfico comparativo y análisis', maxPoints: 10 },
  { id: 'documentation', description: 'Documentación clara en README.md', maxPoints: 10 },
  { id: 'codeStructure', description: 'Estructura y organización del código', maxPoints: 10 },
  { id: 'gitUsage', description: 'Entrega organizada en GitHub', maxPoints: 10 },
];

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

// Función para obtener los archivos de una rama
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

// Función para evaluar un archivo específico con explicaciones detalladas
function evaluateExercise(files, exerciseFile, criteria) {
  const filePresent = files.some(file => file.name === exerciseFile);
  const explanations = {
    executorService: "Se espera configurar un ExecutorService con un pool de hilos y enviar tareas utilizando submit().",
    customTasks: "Cada tarea debe implementar un cálculo personalizado basado en la matrícula, con tiempos de espera adecuados.",
    threadTypes: "Implementar versiones con hilos tradicionales y virtuales en clases separadas.",
    consoleOutput: "Se espera salida en consola con el ID del hilo, tipo de cálculo realizado y tiempo de ejecución.",
    comparisonAnalysis: "El gráfico debe mostrar el tiempo de respuesta de ambas versiones, acompañado de un análisis textual.",
    documentation: "El README.md debe incluir un gráfico comparativo, capturas de consola y una explicación del análisis.",
    codeStructure: "El código debe estar organizado en clases bien nombradas, con comentarios claros y buena estructura.",
    gitUsage: "El proyecto debe estar en una rama nombrada correctamente, con el código y documentación en las ubicaciones esperadas.",
  };

  const feedback = criteria.map(criterion => ({
    criterion: criterion.description,
    score: filePresent ? criterion.maxPoints * 0.7 : criterion.maxPoints * 0.3, // Relajamos la puntuación
    maxPoints: criterion.maxPoints,
    feedback: filePresent
      ? `Cumple parcialmente con: ${criterion.description}.`
      : `Falta: ${criterion.description}. ${explanations[criterion.id] || "No se proporcionó una explicación para este criterio."}`,
  }));

  return { filePresent, feedback };
}

// Calcula la media de las notas individuales y la nota final del proyecto completo
function calculateFinalGrades(traditionalScore, virtualScore) {
  const traditionalGrade = Math.min((traditionalScore / 40) * 10, 10); // Limitar a un máximo de 10
  const virtualGrade = Math.min((virtualScore / 40) * 10, 10); // Limitar a un máximo de 10
  const projectFinalGrade = Math.min((traditionalGrade + virtualGrade) / 2, 10); // Media de las dos notas, máximo 10

  return {
    traditional: traditionalGrade.toFixed(1),
    virtual: virtualGrade.toFixed(1),
    project: projectFinalGrade.toFixed(1),
  };
}

// Función principal para evaluar una rama
async function evaluateBranch(branch) {
  const results = {
    branch: branch,
    scores: {},
    grades: {},
  };

  for (const path of BASE_PATHS) {
    const files = await fetchFiles(branch, path);
    if (files.length > 0) {
      results.scores.traditional = evaluateExercise(files, "TraditionalThreads.java", CRITERIA);
      results.scores.virtual = evaluateExercise(files, "VirtualThreads.java", CRITERIA);

      const traditionalTotal = results.scores.traditional.feedback.reduce((sum, item) => sum + item.score, 0);
      const virtualTotal = results.scores.virtual.feedback.reduce((sum, item) => sum + item.score, 0);

      results.grades = calculateFinalGrades(traditionalTotal, virtualTotal);
      break;
    }
  }

  return results;
}

// Función para evaluar todas las ramas
async function evaluateAllBranches() {
  const branches = await fetchBranches();
  const results = [];
  const summary = []; // Resumen de notas

  for (const branch of branches) {
    if (branch.name.startsWith("feature/ev1")) {
      console.log(`Evaluando la rama: ${branch.name}`);
      try {
        const branchResults = await evaluateBranch(branch.name);
        results.push(branchResults);

        // Añadir al resumen
        summary.push({
          branch: branch.name,
          grades: branchResults.grades,
        });
      } catch (error) {
        console.error(`Error al evaluar la rama ${branch.name}:`, error);
      }
    }
  }

  // Guardar resultados detallados y resumen en JSON
  fs.writeFileSync(
    "evaluation_results.json",
    JSON.stringify({ detailed: results, summary: summary }, null, 2)
  );
  console.log("Resultados guardados en evaluation_results.json");
}

// Ejecutar evaluación
evaluateAllBranches();
