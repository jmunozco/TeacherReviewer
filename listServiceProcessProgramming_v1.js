import fetch from "node-fetch";

// Configuración del token de acceso y URL del repositorio
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

async function fetchCommits(branch) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${branch}`;
  const options = {
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "node.js",
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error al obtener commits de ${branch}: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener commits de ${branch}:`, error);
    return [];
  }
}

async function listAllCommits() {
  const branches = await fetchBranches();
  console.log("Commits en cada rama de los estudiantes:\n");

  for (const branch of branches) {
    if (branch.name.startsWith("feature/ev1")) {
      const commits = await fetchCommits(branch.name);
      console.log(`Rama: ${branch.name}`);

      for (const commit of commits) {
        console.log(`- Commit: ${commit.sha}`);
        console.log(`  Autor: ${commit.commit.author.name}`);
        console.log(`  Fecha: ${commit.commit.author.date}`);
        console.log(`  Mensaje: ${commit.commit.message}\n`);
      }
    }
  }
}

listAllCommits();
