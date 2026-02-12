const params = new URLSearchParams(window.location.search);
const userParam = params.get("user");

if (!userParam) {
  console.error("No ?user= parameter provided");
}

const jsonPath = `data/${userParam}.json`;

console.log("Loading Pokédex from:", jsonPath);


document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("tab")) return;

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

  e.target.classList.add("active");
  document.getElementById(`tab-${e.target.dataset.tab}`).classList.add("active");
});


fetch(`${jsonPath}?v=${Date.now()}`)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to load ${jsonPath}`);
    }
    return response.json();
  })
  .then(data => {
    renderUser(data.user);
    renderPokemon(data.pokemon);
    renderTrainerSummary(data.trainer_stats);
  })
  .catch(error => {
    console.error(error);
  });

function renderUser(user) {
  document.getElementById("trainer-name").textContent = user.username;
  document.getElementById("trainer-avatar").src = user.avatar;
}

function renderTrainerSummary(stats) {

  // ---- STAT TILES ----

  document.getElementById("stat-total").textContent =
    stats.pokedex.total_owned;

  document.getElementById("stat-unique").textContent =
    `${stats.pokedex.unique_owned} / ${stats.pokedex.total_available}`;

  document.getElementById("stat-lines").textContent =
    `${stats.evolution.lines_completed} / ${stats.evolution.total_lines}`;

  document.getElementById("stat-balls").textContent =
    stats.pokeballs.thrown;

  // ---- PROGRESS BARS ----

  const pokedexPercent = stats.pokedex.completion_percent;

  document.getElementById("progress-pokedex").textContent =
    `${Math.floor(pokedexPercent)}%`;

  document.getElementById("progress-fill-pokedex").style.width =
    `${pokedexPercent}%`;


  const linePercent =
    stats.evolution.total_lines > 0
      ? (stats.evolution.lines_completed / stats.evolution.total_lines) * 100
      : 0;

  document.getElementById("progress-lines").textContent =
    `${Math.floor(linePercent)}%`;

  document.getElementById("progress-fill-lines").style.width =
    `${linePercent}%`;



function renderPokemon(pokemonList) {
  const grid = document.getElementById("pokedex-grid");
  grid.innerHTML = "";

  pokemonList.sort((a, b) => a.pokedex_number - b.pokedex_number);

  pokemonList.forEach(pokemon => {
    const li = document.createElement("li");
    li.classList.add("pokemon-card");

    li.classList.add(`type-${pokemon.primary_type.toLowerCase()}`);

    if (pokemon.secondary_type) {
      li.classList.add(`type2-${pokemon.secondary_type.toLowerCase()}`);
    }

    li.classList.add(pokemon.owned ? "owned" : "unowned");


    li.innerHTML = `
      <img 
        class="pokemon-image"
        src="${pokemon.image}"
        alt="${pokemon.name}"
        loading="lazy"
      />
      <div class="pokemon-header">
        <div class="pokemon-name">${pokemon.name}</div>
        <div class="dex-number">#${String(pokemon.pokedex_number).padStart(3, "0")}</div>
      </div>
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


}


