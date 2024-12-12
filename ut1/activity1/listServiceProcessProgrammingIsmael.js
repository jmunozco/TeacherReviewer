import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';

// Cargar variables de entorno
dotenv.config();

// Configuración
const TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'jmunozco';
const REPO_NAME = 'ServiceProcessProgramming';
const BRANCH_NAME = 'feature/ismaelo';
const TARGET_PATH = 'src/com/mymodule/serviceprocessprogramming/ut1_concurrent_programming/project';

// Archivos esperados para cada ejercicio
const EXERCISE_FILES = {
  traditional: 'TraditionalThreads.java',
  virtual: 'VirtualThreads.java',
};

// Archivos generales requeridos
const GENERAL_FILES = ['README.md'];

// Criterios de evaluación y puntajes máximos
const CRITERIA = [
  { id: 'executorService', description: 'Configuración correcta del ExecutorService', maxPoints: 10, defaultScore: 8 },
  { id: 'customTasks', description: 'Implementación correcta de tareas personalizadas', maxPoints: 10, defaultScore: 5 },
  { id: 'threadTypes', description: 'Uso de hilos tradicionales y virtuales', maxPoints: 10, defaultScore: 5 },
  { id: 'consoleOutput', description: 'Salida en consola completa y clara', maxPoints: 10, defaultScore: 5 },
  { id: 'comparisonAnalysis', description: 'Gráfico comparativo y análisis', maxPoints: 10, defaultScore: 5 },
  { id: 'documentation', description: 'Documentación clara en README.md', maxPoints: 10, defaultScore: 5 },
  { id: 'codeStructure', description: 'Estructura y organización del código', maxPoints: 10, defaultScore: 7 },
  { id: 'gitUsage', description: 'Entrega organizada en GitHub', maxPoints: 10, defaultScore: 7 },
];

// Función para obtener el contenido de un directorio en una rama específica
async function fetchDirectoryContents(path) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH_NAME}`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: `token ${TOKEN}`,
      'User-Agent': 'node.js',
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error al acceder a ${path} en la rama ${BRANCH_NAME}: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener el contenido de ${path}:`, error.message);
    return null;
  }
}

// Función para evaluar un archivo específico
function evaluateExercise(files, exerciseFile, criteria) {
  const filePresent = files.some(file => file.name === exerciseFile);
  const feedback = CRITERIA.map(criterion => ({
    criterion: criterion.description,
    score: filePresent ? criterion.defaultScore : 0,
    maxPoints: criterion.maxPoints,
    feedback:
      filePresent
        ? `Cumple parcialmente con: ${criterion.description}.`
        : `Podría mejorar en: ${criterion.description}.`,
  }));
  return { filePresent, feedback };
}

// Calcula la media de las notas individuales y la nota final del proyecto completo
function calculateFinalGrades(traditionalScore, virtualScore, comparisonScore) {
  // Notas individuales de los ejercicios
  const traditionalGrade = (traditionalScore / 40) * 10; // Basado en 40 puntos posibles
  const virtualGrade = (virtualScore / 40) * 10; // Basado en 40 puntos posibles

  // Nota final del proyecto completo como media ponderada
  const projectFinalGrade = ((traditionalScore + virtualScore + comparisonScore) / 80) * 10;

  return {
    traditional: traditionalGrade.toFixed(1),
    virtual: virtualGrade.toFixed(1),
    project: projectFinalGrade.toFixed(1),
  };
}

// Función principal de evaluación
async function evaluateProject() {
  console.log(`Evaluando el proyecto en la rama '${BRANCH_NAME}' en la ruta '${TARGET_PATH}'...`);

  const files = await fetchDirectoryContents(TARGET_PATH);

  if (!files) {
    console.error('No se pudo obtener el contenido del directorio. Evaluación abortada.');
    return;
  }

  // Evaluar ejercicios individuales
  const traditionalResults = evaluateExercise(files, EXERCISE_FILES.traditional, CRITERIA);
  const virtualResults = evaluateExercise(files, EXERCISE_FILES.virtual, CRITERIA);

  // Evaluar archivos generales
  const documentationScore = GENERAL_FILES.every(file => files.some(f => f.name === file)) ? 10 : 5;

  // Suma de puntos por cada ejercicio
  const traditionalTotal = traditionalResults.feedback.reduce((sum, item) => sum + item.score, 0) + documentationScore;
  const virtualTotal = virtualResults.feedback.reduce((sum, item) => sum + item.score, 0) + documentationScore;

  // Asumiendo que comparisonScore es la nota de análisis comparativo
  const comparisonScore = traditionalTotal > 0 && virtualTotal > 0 ? 10 : 0;

  // Calcular notas finales
  const grades = calculateFinalGrades(traditionalTotal, virtualTotal, comparisonScore);

  // Mostrar resultados
  console.log(`Nota final del ejercicio "Hilos Tradicionales": ${grades.traditional}/10`);
  console.log(`Nota final del ejercicio "Virtual Threads": ${grades.virtual}/10`);
  console.log(`Nota final del proyecto completo: ${grades.project}/10`);

  console.log('\nDesglose de puntajes para Hilos Tradicionales:');
  traditionalResults.feedback.forEach(item => {
    console.log(`- ${item.criterion}: ${item.score}/${item.maxPoints} (${item.feedback})`);
  });

  console.log('\nDesglose de puntajes para Virtual Threads:');
  virtualResults.feedback.forEach(item => {
    console.log(`- ${item.criterion}: ${item.score}/${item.maxPoints} (${item.feedback})`);
  });

  // Guardar resultados en JSON
  const evaluationResults = {
    branch: BRANCH_NAME,
    path: TARGET_PATH,
    grades,
    feedback: {
      traditional: traditionalResults.feedback,
      virtual: virtualResults.feedback,
    },
  };

  fs.writeFileSync('evaluation_results.json', JSON.stringify(evaluationResults, null, 2));
  console.log("Resultados de la evaluación guardados en 'evaluation_results.json'.");
}

// Ejecutar evaluación
evaluateProject();
