import dotenv from 'dotenv';
import fetch from "node-fetch";
import { DateTime } from "luxon";

const TOKEN = process.env.GITHUB_TOKEN;

async function fetchCollaboratorRepos(page = 1, allRepos = []) {
  const url = `https://api.github.com/user/repos?affiliation=collaborator&per_page=100&page=${page}`;

  const options = {
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "node.js",
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error: ${response.statusText}`);

    const repos = await response.json();
    allRepos = allRepos.concat(repos);

    if (repos.length === 100) {
      return fetchCollaboratorRepos(page + 1, allRepos);
    } else {
      return allRepos;
    }
  } catch (error) {
    console.error("Error al listar repositorios:", error);
    return allRepos;
  }
}

async function getLastCommitDate(repo) {
  const url = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?sha=${repo.default_branch}&per_page=1`;

  const options = {
    method: "GET",
    headers: {
      Authorization: `token ${TOKEN}`,
      "User-Agent": "node.js",
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Error al obtener el último commit: ${response.statusText}`);

    const commits = await response.json();
    return commits[0]?.commit?.committer?.date || "Fecha de commit no disponible";
  } catch (error) {
    console.error(`Error al obtener el último commit de ${repo.name}:`, error);
    return "Error al obtener fecha de commit";
  }
}

async function listAllCollaboratorRepos() {
  const allRepos = await fetchCollaboratorRepos();

  console.log("Repositorios en los que eres colaborador:");

  for (const repo of allRepos) {
    const lastCommitDate = await getLastCommitDate(repo);

    // Verifica si la fecha del último commit es posterior a las 10 a.m. en Madrid
    if (lastCommitDate !== "Fecha de commit no disponible" && lastCommitDate !== "Error al obtener fecha de commit") {
      const commitDateTime = DateTime.fromISO(lastCommitDate, { zone: "UTC" }).setZone("Europe/Madrid");
      const tenAMMadrid = commitDateTime.startOf("day").plus({ hours: 10 });

      const message = commitDateTime <= tenAMMadrid
        ? "Antes de las 10 a.m."
        : "¡Advertencia! Commit posterior a las 10 a.m.";

      console.log(`- ${repo.name}: ${repo.html_url} (Owner: ${repo.owner.login}) - Último commit: ${commitDateTime.toISO()} (${message})`);
    } else {
      console.log(`- ${repo.name}: ${repo.html_url} (Owner: ${repo.owner.login}) - Último commit: ${lastCommitDate}`);
    }
  }

  // Muestra el conteo final de repositorios
  console.log(`\nTotal de repositorios: ${allRepos.length}`);
}

listAllCollaboratorRepos();
