import fetch from "node-fetch";

const TOKEN = process.env.GITHUB_TOKEN;

async function fetchRepos(page = 1, allRepos = []) {
  const url = `https://api.github.com/user/repos?type=all&per_page=100&page=${page}`;

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

    // Agrega los repositorios obtenidos en esta página a la lista completa
    allRepos = allRepos.concat(repos);

    // Si hay menos de 100 repositorios, estamos en la última página
    if (repos.length === 100) {
      // Llamada recursiva para la siguiente página
      return fetchRepos(page + 1, allRepos);
    } else {
      return allRepos;
    }
  } catch (error) {
    console.error("Error al listar repositorios:", error);
    return allRepos;
  }
}

async function listAllRepos() {
  const allRepos = await fetchRepos();

  console.log("Todos los repositorios a los que tienes acceso:");
  allRepos.forEach((repo) => {
    console.log(`- ${repo.name}: ${repo.html_url} (Owner: ${repo.owner.login})`);
  });
}

listAllRepos();
