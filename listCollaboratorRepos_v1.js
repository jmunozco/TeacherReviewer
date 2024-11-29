import fetch from "node-fetch";

// Reemplaza con tu token de acceso personal
const TOKEN = process.env.GITHUB_TOKEN;

async function listCollaboratorRepos() {
  //const url = "https://api.github.com/user/repos?affiliation=collaborator&per_page=100";
  const url = "https://api.github.com/user/repos?per_page=100&type=all";

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

    console.log("Repositorios en los que eres colaborador:");
    repos.forEach((repo) => {
      //console.log(`- ${repo.name}: ${repo.html_url}`);
      console.log(`- ${repo.name}: ${repo.html_url} (Owner: ${repo.owner.login})`);
    });
  } catch (error) {
    console.error("Error al listar repositorios:", error);
  }
}

listCollaboratorRepos();
