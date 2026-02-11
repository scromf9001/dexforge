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

    if (data.trainer_stats) {
      renderTrainerSummary(data.trainer_stats);
    }
  })
  .catch(error => {
    console.error(error);
  });

function renderUser(user) {
  document.getElementById("trainer-name").textContent = user.username;
  document.getElementById("trainer-avatar").src = user.avatar;
}

function renderTrainerSummary(stats) {
  document.getElementById("tab-summary").innerHTML = `
    <div class="summary-grid">
      <div class="summary-stat">
        <strong>${stats.pokedex.completion_percent}%</strong>
        <span>Pokédex Complete</span>
      </div>

      <div class="summary-stat">
        <strong>${stats.pokedex.unique_owned} / ${stats.pokedex.total_available}</strong>
        <span>Unique Pokémon</span>
      </div>

      <div class="summary-stat">
        <strong>${stats.pokedex.total_owned}</strong>
        <span>Total Caught</span>
      </div>

      <div class="summary-stat">
        <strong>${stats.pokeballs.accuracy_percent}%</strong>
        <span>Catch Accuracy</span>
      </div>
    </div>
  `;
}


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

  document.getElementById("pokemon-count").textContent =
    `Pokémon: ${pokemonList.length}`;
}


