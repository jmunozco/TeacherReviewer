import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas de los archivos
const projectRoot = path.resolve(__dirname);
const alumnosPath = path.join(projectRoot, 'alumnos.json');
const activity1ResultsPath = path.join(projectRoot, 'ut2/activity1/activity1_evaluation_results.json');
const activity2ResultsPath = path.join(projectRoot, 'ut2/activity2/activity2_evaluation_results.json');
const outputCsvPath = path.join(projectRoot, 'importacion.csv');

// Leer archivos JSON
const alumnos = JSON.parse(fs.readFileSync(alumnosPath, 'utf8'));
const activity1Results = JSON.parse(fs.readFileSync(activity1ResultsPath, 'utf8'));
const activity2Results = JSON.parse(fs.readFileSync(activity2ResultsPath, 'utf8'));

// Función para encontrar el alumno correspondiente a una rama
function findAlumnoByBranch(branchName) {
  const nameParts = branchName.replace('feature/ev1', '').split(/(?=[A-Z])/);
  const apellido1 = nameParts[0].toLowerCase();
  const apellido2 = nameParts[1] ? nameParts[1].toLowerCase() : '';
  const nombre1 = nameParts[2] ? nameParts[2].toLowerCase() : '';
  const nombre2 = nameParts[3] ? nameParts[3].toLowerCase() : '';

  console.log(`Buscando alumno para la rama: ${branchName} (Apellido1: ${apellido1}, Apellido2: ${apellido2}, Nombre1: ${nombre1}, Nombre2: ${nombre2})`);

  const alumno = alumnos.find(alumno => {
    if (!alumno.apellidos || !alumno.nombre) {
      console.warn(`Datos incompletos para el alumno: ${JSON.stringify(alumno)}`);
      return false;
    }
    const alumnoApellidos = alumno.apellidos.toLowerCase().split(' ');
    const alumnoNombre = alumno.nombre.toLowerCase().split(' ');

    return (
      (alumnoApellidos.includes(apellido1) || alumnoApellidos.includes(apellido2)) &&
      (alumnoNombre.includes(nombre1) || alumnoNombre.includes(nombre2))
    );
  });

  if (!alumno) {
    console.warn(`No se encontró un alumno para la rama: ${branchName}`);
  }

  return alumno;
}

// Crear el CSV
const csvWriterInstance = createCsvWriter({
  path: outputCsvPath,
  header: [
    { id: 'email', title: 'email' },
    { id: 'notaEjercicio1', title: 'nota del ejercicio 1' },
    { id: 'notaEjercicio2', title: 'nota del ejercicio 2' },
    { id: 'comentariosEjercicio1', title: 'comentarios del ejercicio 1' },
    { id: 'comentariosEjercicio2', title: 'comentarios del ejercicio 2' }
  ]
});

const records = [];

activity1Results.forEach(result1 => {
  const alumno = findAlumnoByBranch(result1.branch);
  if (alumno) {
    const result2 = activity2Results.find(result => result.branch === result1.branch);
    records.push({
      email: alumno.direccindecorreo,
      notaEjercicio1: result1.totalPoints,
      notaEjercicio2: result2 ? result2.totalPoints : '',
      comentariosEjercicio1: result1.comments.join('; '),
      comentariosEjercicio2: result2 ? result2.comments.join('; ') : ''
    });
  } else {
    console.warn(`No se encontró un alumno para la rama: ${result1.branch}`);
  }
});

csvWriterInstance.writeRecords(records)
  .then(() => {
    console.log('Archivo importacion.csv generado correctamente.');
  })
  .catch(err => {
    console.error('Error al generar el archivo CSV:', err);
  });    console.error('Error al generar el archivo CSV:', err);
  });