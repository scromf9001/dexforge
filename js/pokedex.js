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
  // HERO
  document.getElementById("hero-completion").textContent =
    `${stats.pokedex.completion_percent}%`;

  // CORE STATS
  document.getElementById("stat-unique").textContent =
    stats.pokedex.unique_owned;

  document.getElementById("stat-total").textContent =
    stats.pokedex.total_owned;

  document.getElementById("stat-evolvable").textContent =
    stats.evolution.evolvable_owned;

  document.getElementById("stat-lines").textContent =
    stats.evolution.lines_completed;

  // CATCH ACCURACY
  document.getElementById("catch-percent").textContent =
    `${stats.pokeballs.accuracy_percent}%`;

  document.getElementById("catch-fill").style.width =
    `${stats.pokeballs.accuracy_percent}%`;
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


}


