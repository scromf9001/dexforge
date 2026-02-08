const params = new URLSearchParams(window.location.search);
const userParam = params.get("user");

if (!userParam) {
  console.error("No ?user= parameter provided");
}

const jsonPath = `data/${userParam}.json`;

console.log("Loading Pokédex from:", jsonPath);

fetch(jsonPath)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load ${jsonPath}`);
    }
    return response.json();
  })
  .then(data => {
    renderUser(data.user);
    renderPokemon(data.pokemon);
  })
  .catch(error => {
    console.error(error);
  });

function renderUser(user) {
  document.getElementById("trainer-name").textContent = user.username;
  document.getElementById("trainer-avatar").src = user.avatar;
}

function renderPokemon(pokemonList) {
  const grid = document.getElementById("pokedex-grid");
  grid.innerHTML = "";

  pokemonList.sort((a, b) => a.pokedex_number - b.pokedex_number);

  pokemonList.forEach(pokemon => {
    const li = document.createElement("li");
    li.className = "pokemon-card";

    li.innerHTML = `
      <div class="dex-number">#${String(pokemon.pokedex_number).padStart(3, "0")}</div>
      <div class="pokemon-name">${pokemon.name}</div>
      <div class="pokemon-count">x${pokemon.count}</div>
      <div class="pokemon-types">
        <span class="type ${pokemon.primary_type.toLowerCase()}">${pokemon.primary_type}</span>
        ${
          pokemon.secondary_type && pokemon.secondary_type !== "Null"
            ? `<span class="type ${pokemon.secondary_type.toLowerCase()}">${pokemon.secondary_type}</span>`
            : ""
        }
      </div>
    `;

    grid.appendChild(li);
  });

  document.getElementById("pokemon-count").textContent =
    `Pokémon caught: ${pokemonList.length}`;
}
