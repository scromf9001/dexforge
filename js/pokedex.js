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
    renderRegions(data.trainer_stats);
    renderTypeMastery(data.trainer_stats);
    renderCapture(data.trainer_stats);
  })
  .catch(error => {
    console.error(error);
  });

function renderUser(user) {
  document.getElementById("trainer-name").textContent = user.username;
  document.getElementById("trainer-avatar").src = user.avatar;
}

// ---- SUMMARY TRAINER CARD ----

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

}

// ---- REGIONS TRAINER CARD ----

function renderRegions(stats) {
  const container = document.getElementById("tab-regions");

  const evo = stats.evolution;
  const legendary = stats.legendary;

  container.innerHTML = `
    <div class="regions-global">
      <h3>Global Evolution Overview</h3>

      <div class="regions-global-stats">
        <div class="regions-stat">
          <strong>${evo.total_evolutions_owned} / ${evo.total_evolutions_available}</strong>
          <span>Total Evolutions Owned</span>
        </div>

        <div class="regions-stat">
          <strong>${evo.lines_completed} / ${evo.total_lines}</strong>
          <span>Evolution Lines Completed</span>
        </div>

        <div class="regions-stat">
          <strong>${stats.journey.times_evolved}</strong>
          <span>Times Evolved</span>
        </div>

        <div class="regions-stat">
          <strong>${legendary.owned} / ${legendary.total}</strong>
          <span>Legendary & Mythic</span>
        </div>
      </div>

      ${renderStageBars(evo)}
    </div>

    <div class="regions-grid">
      ${renderRegionCards(stats.generation_progress)}
    </div>
  `;
}

function renderStageBars(evo) {
  let html = "";

  for (let stage = 1; stage <= 4; stage++) {
    const owned = evo.stage_owned[stage] || 0;
    const total = evo.stage_totals[stage] || 0;
    const percent = total > 0 ? (owned / total) * 100 : 0;

    html += `
      <div class="stage-progress">
        <div class="stage-label">
          <span>Stage ${stage}</span>
          <span>${owned} / ${total}</span>
        </div>
        <div class="stage-bar">
          <div class="stage-fill" style="width:${percent}%"></div>
        </div>
      </div>
    `;
  }

  return html;
}

function renderRegionCards(generations) {
  let html = "";

  Object.values(generations || {}).forEach(gen => {

    const pokedexPercent = gen.total > 0
      ? (gen.owned / gen.total) * 100
      : 0;

    const linePercent = gen.total_lines > 0
      ? (gen.lines_completed / gen.total_lines) * 100
      : 0;

    html += `
      <div class="region-card">
        <h4>${gen.region}</h4>

        <div class="region-stats">
          Unique Pokémon: ${gen.owned} / ${gen.total}<br>
          Evolution Lines: ${gen.lines_completed} / ${gen.total_lines}
        </div>

        <div class="region-progress">
          <div class="region-progress-label">
            <span>Pokédex</span>
            <span>${Math.floor(pokedexPercent)}%</span>
          </div>
          <div class="region-bar">
            <div class="region-fill" style="width:${pokedexPercent}%"></div>
          </div>
        </div>

        <div class="region-progress">
          <div class="region-progress-label">
            <span>Evolution Lines</span>
            <span>${Math.floor(linePercent)}%</span>
          </div>
          <div class="region-bar">
            <div class="region-fill" style="width:${linePercent}%"></div>
          </div>
        </div>

      </div>
    `;
  });

  return html;
}

// ---- TYPE MASTERY TRAINER CARD ----

function renderTypeMastery(stats) {
  const container = document.getElementById("tab-types");
  const types = stats.types;

  // Convert object to array and sort strongest first
  const sortedTypes = Object.entries(types)
    .map(([type, data]) => ({
      type,
      owned: data.owned,
      total: data.total,
      percent: data.completion_percent
    }))
    .sort((a, b) => b.percent - a.percent);

  let html = `<div class="types-grid">`;

  sortedTypes.forEach(t => {
    html += `
      <div class="type-card">
        <div class="type-title type ${t.type}">
          ${t.type.toUpperCase()}
        </div>

        <div class="type-stats">
          ${t.owned} / ${t.total}
        </div>

        <div class="type-progress">
          <div class="type-progress-label">
            <span>Completion</span>
            <span>${Math.floor(t.percent)}%</span>
          </div>

          <div class="type-bar">
            <div class="type-fill type-${t.type}" 
                 style="width:${t.percent}%">
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  container.innerHTML = html;
}

// ---- CAPTURE PERFORMANCE TRAINER CARD ----

function renderCapture(stats) {
  const container = document.getElementById("tab-capture");
  const balls = stats.pokeballs.details;

  const ballSprites = {
    "poke ball": "https://archives.bulbagarden.net/media/upload/b/b3/Pok%C3%A9_Ball_ZA_Art.png",
    "great ball": "https://archives.bulbagarden.net/media/upload/5/54/Bag_Great_Ball_SV_Sprite.png",
    "ultra ball": "https://archives.bulbagarden.net/media/upload/5/55/Bag_Ultra_Ball_SV_Sprite.png",
    "master ball": "https://archives.bulbagarden.net/media/upload/a/a6/Bag_Master_Ball_SV_Sprite.png"
  };

  const order = ["poke ball", "great ball", "ultra ball", "master ball"];

  container.innerHTML = `
    <div class="capture-global">
      <div class="capture-global-stats">
        <div class="capture-stat">
          <strong>${stats.pokeballs.thrown}</strong>
          <span>Total Balls Thrown</span>
        </div>

        <div class="capture-stat">
          <strong>${stats.pokeballs.success}</strong>
          <span>Total Successful Catches</span>
        </div>

        <div class="capture-stat">
          <strong>${Math.floor(stats.pokeballs.accuracy_percent)}%</strong>
          <span>Overall Accuracy</span>
        </div>

        <div class="capture-stat">
          <img src="${ballSprites[stats.pokeballs.most_used] || ""}">
          <strong>${stats.pokeballs.most_used || "N/A"}</strong>
          <span>Most Used Ball</span>
        </div>
      </div>
    </div>

    <div class="capture-grid">
      ${order.map(ball => {
        const data = balls[ball];
        const percent = data.thrown > 0 ? data.accuracy_percent : 0;

        const colorClass =
          ball === "poke ball" ? "ball-poke" :
          ball === "great ball" ? "ball-great" :
          ball === "ultra ball" ? "ball-ultra" :
          "ball-master";

        return `
          <div class="capture-card">
            <div class="capture-card-header">
              <img src="${ballSprites[ball]}">
              <strong>${ball.toUpperCase()}</strong>
            </div>

            <div>Thrown: ${data.thrown}</div>
            <div>Success: ${data.success}</div>
            <div>Accuracy: ${Math.floor(percent)}%</div>

            <div class="capture-bar">
              <div class="capture-fill ${colorClass}" 
                   style="width:${percent}%"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}


// ---- POKEMON LIST ----

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


