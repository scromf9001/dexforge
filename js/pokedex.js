const params = new URLSearchParams(window.location.search);
const userParam = params.get("user");

if (!userParam) {
  console.error("No ?user= parameter provided");
}

const jsonPath = `data/${userParam}.json`;

console.log("Loading Pokédex from:", jsonPath);

let allPokemon = [];
let activeFilters = {
  search: "",
  ownership: "all",
  region: "all",
  type: "all",
  stage: "all",
  line: "all",
  evolvable: "all",
  friendship: "all",
  special: "all"
};

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
    allPokemon = data.pokemon;
    populateRegionFilter(allPokemon);
    populateTypeFilter(allPokemon);
    buildStageFilter(allPokemon);
    renderPokemon(allPokemon);
    renderUser(data.user);
    renderTrainerSummary(data.trainer_stats);
    renderRegions(data.trainer_stats);
    renderTypeMastery(data.trainer_stats);
    renderCapturePerformance(data.trainer_stats);
    renderJourney(data.trainer_stats);
    renderCompanion(data);
  })
  .catch(error => {
    console.error(error);
  });

function renderUser(user) {
  const name = user.username;
  const possessive = name.endsWith("s") ? `${name}'` : `${name}'s`;

  document.getElementById("trainer-name").textContent =
    `${possessive} Pokédex`;

  document.getElementById("trainer-avatar").src = user.avatar;
}

function buildStageFilter(pokemonList) {
  const stageSelect = document.getElementById("filter-stage");

  // Get unique stages from dataset
  const stages = [...new Set(
    pokemonList.map(p => p.evolution_stage)
  )];

  // Sort numerically but keep "mega" last
  stages.sort((a, b) => {
    if (a === "mega") return 1;
    if (b === "mega") return -1;
    return Number(a) - Number(b);
  });

  stages.forEach(stage => {
    if (!stage) return;

    const option = document.createElement("option");

    if (stage === "mega") {
      option.value = "mega";
      option.textContent = "Mega";
    } else {
      option.value = String(stage);
      option.textContent = `Stage ${stage}`;
    }

    stageSelect.appendChild(option);
  });
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

function renderCapturePerformance(stats) {
  const container = document.getElementById("tab-capture");
  const balls = stats.pokeballs;

  const ballOrder = [
    { key: "poke ball", label: "Poke Ball", class: "poke", icon: "assets/balls/poke.png" },
    { key: "great ball", label: "Great Ball", class: "great", icon: "assets/balls/great.png" },
    { key: "ultra ball", label: "Ultra Ball", class: "ultra", icon: "assets/balls/ultra.png" },
    { key: "master ball", label: "Master Ball", class: "master", icon: "assets/balls/master.png" }
  ];

  const mostUsed = balls.most_used;
  const mostUsedObj = ballOrder.find(b => b.key === mostUsed);

  container.innerHTML = `
    <div class="capture-global">
      <div class="regions-global-stats">

        <div class="regions-stat">
          <strong>${balls.thrown}</strong>
          <span>Total Balls Thrown</span>
        </div>

        <div class="regions-stat">
          <strong>${balls.success}</strong>
          <span>Total Successful Catches</span>
        </div>

        <div class="regions-stat">
          <strong>${Math.floor(balls.accuracy_percent)}%</strong>
          <span>Overall Accuracy</span>
        </div>

        <div class="regions-stat capture-stat">
          <img src="${mostUsedObj?.icon || ""}" class="capture-most-icon">
          <span>Most Used Ball</span>
        </div>
      </div>
    </div>

    <div class="ball-breakdown">
      ${ballOrder.map(ball => renderBallRow(ball, balls.details[ball.key] || {})).join("")}
    </div>
  `;
}

function renderBallRow(ball, data) {
  const thrown = data.thrown || 0;
  const success = data.success || 0;
  const percent = data.accuracy_percent || 0;

  return `
    <div class="ball-row">

      <img src="${ball.icon}" class="ball-icon">

      <div class="ball-info">

        <div class="ball-title">${ball.label}</div>

        <div class="ball-stats">
          Thrown: ${thrown}<br>
          Success: ${success}
        </div>

        <div class="ball-progress-label">
          <span>Accuracy</span>
          <span>${Math.floor(percent)}%</span>
        </div>

        <div class="ball-bar">
          <div class="ball-fill ${ball.class}" style="width:${percent}%"></div>
        </div>

      </div>
    </div>
  `;
}

// ---- TRAINER JOURNEY TAB ----

function renderJourneyStat(value, label) {
  return `
    <div class="journey-stat">
      <strong>${value ?? 0}</strong>
      <span>${label}</span>
    </div>
  `;
}


function renderJourney(stats) {
  const container = document.getElementById("tab-journey");
  const journey = stats.journey;

  if (!journey) {
    container.innerHTML = "<div class='journey-empty'>No journey data.</div>";
    return;
  }

  container.innerHTML = `
    <div class="journey-container">
      ${renderJourneyIdentity(journey)}
      ${renderJourneyActivity(journey)}
      ${renderJourneyInteraction(journey)}
      ${renderJourneyPokebag(journey.pokebag)}
    </div>
  `;

  if (journey.ball_distribution) {
    renderBallPieChart(journey.ball_distribution);
  }
}



// ---- TRAINER JOURNEY TAB - IDENTITY SECTION ----

function renderJourneyIdentity(journey) {
  return `
    <div class="journey-section">
      <h3>Trainer Identity</h3>

      <div class="journey-stats-grid">
        ${renderJourneyStat(journey.follow_age, "Follower Age")}
        ${renderJourneyStat(journey.sub_age, "Sub Age")}
        ${renderJourneyStat(journey.sub_months || 0, "Sub Months")}
        ${renderJourneyStat(journey.subs_gifted || 0, "Subs Gifted")}
      </div>
    </div>
  `;
}


// ---- TRAINER JOURNEY TAB - ACTIVITY SECTION ----

function renderJourneyActivity(journey) {
  return `
    <div class="journey-section">
      <h3>Channel Activity</h3>

      <div class="journey-stats-grid">
        ${renderJourneyStat(journey.streams_watched, "Streams Watched")}
        ${renderJourneyStat(journey.watch_hours, "Watch Hours")}
        ${renderJourneyStat(journey.chat_messages, "Chat Messages")}
        ${renderJourneyStat(journey.commands_run, "Commands Run")}
      </div>
    </div>
  `;
}


// ---- TRAINER JOURNEY TAB - POKEMON INTERACTION SECTION ----

function renderJourneyInteraction(journey) {
  return `
    <div class="journey-section">
      <h3>Pokémon Interaction</h3>

      <div class="journey-interaction-grid">

        <div class="journey-interaction-stats">
          ${renderJourneyStat(journey.times_evolved, "Times Evolved")}
          ${renderJourneyStat(journey.times_traded, "Times Traded")}
          ${renderJourneyStat(journey.times_eggs_hatched || 0, "Eggs Hatched")}
        </div>

        <div class="journey-pie-container">
          <canvas id="ballPieChart"></canvas>
        </div>

      </div>
    </div>
  `;
}


// ---- TRAINER JOURNEY TAB - BALL DISTRIBUTION SECTION ----

let ballChartInstance = null;

function renderBallPieChart(distribution) {
  const ctx = document.getElementById("ballPieChart");

  if (!ctx || !distribution) return;

  if (ballChartInstance) {
    ballChartInstance.destroy();
  }

  const data = [
    distribution["poke ball"] || 0,
    distribution["great ball"] || 0,
    distribution["ultra ball"] || 0,
    distribution["master ball"] || 0
  ];

  ballChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Poke Ball", "Great Ball", "Ultra Ball", "Master Ball"],
      datasets: [{
        data: data,
        backgroundColor: [
          "#e53935",
          "#1e88e5",
          "#fbc02d",
          "#8e24aa"
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            boxWidth: 14,
            boxHeight: 14,
            padding: 12,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = Math.round(context.raw);
              return `${context.label}: ${value}%`;
            }
          }
        }
      }
    }
  });
}



// ---- TRAINER JOURNEY TAB - POKEBAG SECTION ----

function renderJourneyPokebag(bag) {

  function getItemClass(itemName) {
    const name = itemName.toLowerCase();

    // Balls
    if (name.includes("poke ball")) return "item-poke";
    if (name.includes("great ball")) return "item-great";
    if (name.includes("ultra ball")) return "item-ultra";
    if (name.includes("master ball")) return "item-master";
    if (name.includes("god ball")) return "item-god";

    // Stones
    if (name.includes("fire stone")) return "item-fire";
    if (name.includes("water stone")) return "item-water";
    if (name.includes("thunder stone")) return "item-electric";
    if (name.includes("leaf stone")) return "item-grass";
    if (name.includes("moon stone")) return "item-fairy";

    if (name.includes("sun stone")) return "item-sun";
    if (name.includes("shiny stone")) return "item-shiny";
    if (name.includes("dusk stone")) return "item-dark";
    if (name.includes("dawn stone")) return "item-psychic";
    if (name.includes("ice stone")) return "item-ice";

    if (name.includes("berry")) return "item-berry";

    return "item-default";
  }

  if (!bag || Object.keys(bag).length === 0) {
    return `
      <div class="journey-section">
        <h3>Pokébag</h3>
        <div class="journey-empty">Bag is empty.</div>
      </div>
    `;
  }

  const items = Object.entries(bag)
    .map(([name, qty]) => {
      const itemClass = getItemClass(name);

      return `
        <div class="journey-bag-item ${itemClass}">
          ${name} x${qty}
        </div>
      `;
    })
    .join("");

  return `
    <div class="journey-section">
      <h3>Pokébag</h3>
      <div class="journey-bag-grid">
        ${items}
      </div>
    </div>
  `;
}

  // ----- COMPANION TAB -----

function renderCompanion(data) {

  const container = document.getElementById("tab-companion");
  const companion = data.companion;

  if (!companion) {
    container.innerHTML = `
      <div class="companion-empty">
        No companion equipped.
      </div>
    `;
    return;
  }

  const timesPet = companion.times_pet ?? 0;
  const berriesFed = companion.berries_fed ?? 0;

  // ----- PROGRESS -----

  let progressHTML = "";

  if (companion.friendship_requirement) {

    const requirement = companion.friendship_requirement;
    const current = companion.friendship_points;

    const percent = Math.min((current / requirement) * 100, 100);
    const surplus = current > requirement ? current - requirement : 0;

    progressHTML = `
      <div class="companion-progress">
        <div class="companion-progress-label">
          <span>Friendship Progress</span>
          <span>${Math.floor(percent)}%</span>
        </div>
        <div class="companion-bar">
          <div class="companion-fill" style="width:${percent}%"></div>
        </div>
        ${
          current >= requirement
            ? `<div class="companion-progress-status">
                 Requirement Met
                 ${surplus > 0 ? `<span class="surplus">+${surplus}</span>` : ""}
               </div>`
            : `<div class="companion-progress-status">
                 ${current} / ${requirement}
               </div>`
        }
      </div>
    `;
  }

  // ----- UNIQUE EVOLUTION LINES -----

  const lineMap = {};

  data.pokemon.forEach(p => {
    if (p.friendship_points > 0) {

      const lineId = p.evolution_line_id;

      // keep earliest evolution stage per line
      if (
        !lineMap[lineId] ||
        Number(p.evolution_stage) < Number(lineMap[lineId].evolution_stage)
      ) {
        lineMap[lineId] = p;
      }
    }
  });

  const topFriendship = Object.values(lineMap)
    .sort((a, b) => b.friendship_points - a.friendship_points)
    .slice(0, 5);

  const topHTML = topFriendship.length > 0
    ? topFriendship.map(p => `
        <div class="companion-top-card">
          <img src="${p.image}" class="companion-top-sprite">
          <div class="companion-top-info">
            <div class="companion-top-name">${p.name}</div>
            <div class="companion-top-points">❤️ ${p.friendship_points}</div>
          </div>
        </div>
      `).join("")
    : `<div class="companion-empty">No friendship earned yet.</div>`;

  // ----- FINAL HTML -----

  container.innerHTML = `
    <div class="companion-spotlight">

      <div class="companion-info">

        <!-- TOP SECTION -->
        <div class="companion-info-top">

          <h2>
            ${companion.name}
            #${String(companion.pokedex_number).padStart(3, "0")}
          </h2>

          <div class="modal-types">
            <span class="type ${companion.primary_type.toLowerCase()}">
              ${companion.primary_type}
            </span>
            ${
              companion.secondary_type
                ? `<span class="type ${companion.secondary_type.toLowerCase()}">
                    ${companion.secondary_type}
                  </span>`
                : ""
            }
          </div>

          <div class="companion-friendship-main">
            ❤️ ${companion.friendship_points}
          </div>

          ${progressHTML}

        </div>

        <!-- BOTTOM SECTION -->
        <div class="companion-interactions">
          <h4>All Companion Interactions</h4>

          <div class="companion-interaction-grid">

            <div class="companion-stat">
              <strong>${timesPet}</strong>
              <span>Times Pet</span>
            </div>

            <div class="companion-stat">
              <strong>${berriesFed}</strong>
              <span>Berries Fed</span>
            </div>

          </div>
        </div>

      </div>

      <div class="companion-sprite-wrapper">
        <img src="${companion.image}" class="companion-main-sprite">
      </div>

    </div>

    <div class="companion-top-section">
      <h3>Top Friendship Lines</h3>
      <div class="companion-top-grid">
        ${topHTML}
      </div>
    </div>
  `;
}
// ---- FILTER BAR ----

function applyFilters() {
  const filtered = allPokemon.filter(pokemon => {

    // Search
    if (activeFilters.search &&
        !pokemon.name.toLowerCase().includes(activeFilters.search))
      return false;

    // Ownership
    if (activeFilters.ownership === "owned" && !pokemon.owned)
      return false;

    if (activeFilters.ownership === "unowned" && pokemon.owned)
      return false;

    // Region
    if (activeFilters.region !== "all" &&
        pokemon.region !== activeFilters.region)
      return false;

    // Type
    if (activeFilters.type !== "all") {
      const matchesPrimary = pokemon.primary_type.toLowerCase() === activeFilters.type;
      const matchesSecondary = pokemon.secondary_type &&
                               pokemon.secondary_type.toLowerCase() === activeFilters.type;
      if (!matchesPrimary && !matchesSecondary)
        return false;
    }

    // Stage
    if (activeFilters.stage !== "all" &&
        String(pokemon.evolution_stage) !== activeFilters.stage)
      return false;

    // Line status
    if (activeFilters.line === "complete" && !pokemon.line_complete)
      return false;

    if (activeFilters.line === "incomplete" && pokemon.line_complete)
      return false;

    // Evolvable
    if (activeFilters.evolvable === "yes" && !pokemon.evolvable_now)
      return false;

    if (activeFilters.evolvable === "no" && pokemon.evolvable_now)
      return false;

    // Special
    if (activeFilters.special === "legendary" && !pokemon.is_legendary)
      return false;

    if (activeFilters.special === "mythic" && !pokemon.is_mythic)
      return false;

    if (activeFilters.special === "hatchable" && !pokemon.is_hatchable)
      return false;

    if (activeFilters.special === "stone" && !pokemon.requires_stone)
      return false;

    if (activeFilters.special === "trade" && !pokemon.requires_trade)
      return false;

    if (activeFilters.special === "friendship" && 
        !pokemon.friendship_requirement)
      return false;

    // Friendship filter
    if (activeFilters.friendship === "has" && 
        pokemon.friendship_points <= 0)
      return false;

    if (activeFilters.friendship === "none" && 
        pokemon.friendship_points > 0)
      return false;

    return true;
  });

  renderPokemon(filtered);
}

function populateRegionFilter(pokemonList) {

  const select = document.getElementById("filter-region");
  if (!select) return;

  const regionMap = {};

  pokemonList.forEach(p => {
    if (!regionMap[p.region]) {
      regionMap[p.region] = p.generation;
    }
  });

  Object.entries(regionMap)
    .sort((a, b) => a[1] - b[1])  // sort by generation
    .forEach(([region, generation]) => {

      const option = document.createElement("option");
      option.value = region;
      option.textContent = `${region} (Gen ${generation})`;

      select.appendChild(option);
    });
}

function populateTypeFilter(pokemonList) {
  const select = document.getElementById("filter-type");
  if (!select) return;

  const types = new Set();

  pokemonList.forEach(p => {
    types.add(p.primary_type.toLowerCase());
    if (p.secondary_type && p.secondary_type !== "Null") {
      types.add(p.secondary_type.toLowerCase());
    }
  });

  Array.from(types).sort().forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    select.appendChild(option);
  });
}


document.addEventListener("DOMContentLoaded", () => {

  const search = document.getElementById("filter-search");
  if (!search) return; // guard

  search.addEventListener("input", e => {
    activeFilters.search = e.target.value.toLowerCase();
    applyFilters();
  });

  document.getElementById("filter-ownership")?.addEventListener("change", e => {
    activeFilters.ownership = e.target.value;
    applyFilters();
  });

  document.getElementById("filter-region")?.addEventListener("change", e => {
    activeFilters.region = e.target.value;
    applyFilters();
  });

  document.getElementById("filter-type")?.addEventListener("change", e => {
    activeFilters.type = e.target.value;
    applyFilters();
  });

  document.getElementById("filter-stage")?.addEventListener("change", e => {
    activeFilters.stage = e.target.value;
    applyFilters();
  });

  document.getElementById("filter-line")?.addEventListener("change", e => {
    activeFilters.line = e.target.value;
    applyFilters();
  });

  document.getElementById("filter-evolvable")?.addEventListener("change", e => {
    activeFilters.evolvable = e.target.value;
    applyFilters();
  });

  document.getElementById("filter-special")?.addEventListener("change", e => {
    activeFilters.special = e.target.value;
    applyFilters();
  });

  document.getElementById("filter-friendship")?.addEventListener("change", e => {
    activeFilters.friendship = e.target.value;
    applyFilters();
  });

  document.getElementById("filter-reset")?.addEventListener("click", () => {
    activeFilters = {
      search: "",
      ownership: "all",
      region: "all",
      type: "all",
      stage: "all",
      line: "all",
      evolvable: "all",
      friendship: "all",
      special: "all"
    };

    document.querySelectorAll(".filter-bar select").forEach(el => el.value = "all");
    document.getElementById("filter-search").value = "";

    applyFilters();
  });

});




// ---- POKEMON LIST ----

function renderPokemon(pokemonList) {
  const grid = document.getElementById("pokedex-grid");
  grid.innerHTML = "";

  pokemonList.sort((a, b) => a.pokedex_number - b.pokedex_number);

  pokemonList.forEach(pokemon => {
    const li = document.createElement("li");
    li.classList.add("pokemon-card");

    li.classList.add(`type-${pokemon.primary_type.toLowerCase()}`);

    li.classList.add(pokemon.owned ? "owned" : "unowned");

    li.addEventListener("click", () => {
      openPokemonModal(pokemon.pokedex_number);
    });

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
          pokemon.secondary_type &&
          pokemon.secondary_type !== "Null" &&
          pokemon.secondary_type !== "null"
            ? `<span class="type ${pokemon.secondary_type.toLowerCase()}">
                ${pokemon.secondary_type}
              </span>`
            : ""
        }
      </div>
    `;

    grid.appendChild(li);
  });


}

// ---- POKEMON CARD ----

let currentPokemonIndex = null;

function openPokemonModal(pokedexNumber) {
  const modal = document.getElementById("pokemon-modal");
  const card = document.getElementById("pokemon-modal-card");

  currentPokemonIndex = allPokemon.findIndex(
    p => p.pokedex_number === pokedexNumber
  );

  const pokemon = allPokemon[currentPokemonIndex];

  // Reset classes
  card.className = "pokemon-modal-card";

  // Add type class dynamically
  card.classList.add(pokemon.primary_type.toLowerCase());

  renderPokemonModalContent(pokemon);

  modal.classList.remove("hidden");

  setTimeout(() => {
    card.classList.add("active");
  }, 10);
}


function closePokemonModal() {
  const modal = document.getElementById("pokemon-modal");
  const card = document.getElementById("pokemon-modal-card");

  card.classList.remove("active");

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 300);
}

// NAVIGATION

document.getElementById("modal-prev").addEventListener("click", () => {
  if (currentPokemonIndex > 0) {
    currentPokemonIndex--;
    renderPokemonModalContent(allPokemon[currentPokemonIndex]);
  }
});

document.getElementById("modal-next").addEventListener("click", () => {
  if (currentPokemonIndex < allPokemon.length - 1) {
    currentPokemonIndex++;
    renderPokemonModalContent(allPokemon[currentPokemonIndex]);
  }
});

document.querySelector(".modal-close").addEventListener("click", closePokemonModal);

document.querySelector(".pokemon-modal-backdrop").addEventListener("click", closePokemonModal);

// RENDER POKEMON MODAL CONTENT

function renderPokemonModalContent(pokemon) {

  document.getElementById("modal-title").innerHTML =
    `${pokemon.name} #${String(pokemon.pokedex_number).padStart(4, "0")}`;

  const strengthsHTML = pokemon.strengths.map(s =>
    `<span class="type ${s.type}">
      ${s.type.toUpperCase()} x${s.multiplier}
    </span>`
  ).join("");

  const weaknessesHTML = pokemon.weaknesses.map(w =>
    `<span class="type ${w.type}">
      ${w.type.toUpperCase()} x${w.multiplier}
    </span>`
  ).join("");

  const evolutionHTML = pokemon.evolution_line.map(evo => `
    <div class="modal-evo" data-dex="${evo.pokedex_number}">
      <img src="${evo.image}">
      <div>#${String(evo.pokedex_number).padStart(3,"0")}</div>
    </div>
  `).join("");

  // FRIENDSHIP TAG
  const friendshipTag = pokemon.friendship_points > 0
    ? `<span class="tag friendship">
         <span class="heart-icon">❤</span>
         ${pokemon.friendship_points}
       </span>`
    : "";

  document.getElementById("modal-content").innerHTML = `
    <div class="modal-grid">

      <div class="modal-left">

        ${pokemon.owned ? `<div class="owned-badge">OWNED</div>` : ""}

        <div class="modal-tags">
          ${pokemon.is_legendary ? `<span class="tag legendary">Legendary</span>` : ""}
          ${pokemon.is_mythic ? `<span class="tag mythic">Mythic</span>` : ""}
          ${pokemon.is_hatchable ? `<span class="tag hatchable">Hatchable</span>` : ""}
          ${pokemon.requires_stone ? `<span class="tag stone">Stone</span>` : ""}
          ${pokemon.requires_trade ? `<span class="tag trade">Trade</span>` : ""}
          ${friendshipTag}
        </div>

        <img src="${pokemon.image}" class="modal-main-image">

        <div class="modal-types">
          <span class="type ${pokemon.primary_type.toLowerCase()}">
            ${pokemon.primary_type}
          </span>
          ${
            pokemon.secondary_type
              ? `<span class="type ${pokemon.secondary_type.toLowerCase()}">
                  ${pokemon.secondary_type}
                </span>`
              : ""
          }
        </div>

        <div class="modal-physical">
          <div>Height: ${pokemon.physical.height} m</div>
          <div>Weight: ${pokemon.physical.weight} kg</div>
        </div>

        <p class="modal-entry">
          ${pokemon.pokedex_entry || "No entry available."}
        </p>

      </div>

      <div class="modal-right">

        <div class="modal-stats">
          ${renderStatBar("HP", pokemon.stats.hp)}
          ${renderStatBar("Attack", pokemon.stats.attack)}
          ${renderStatBar("Defense", pokemon.stats.defense)}
          ${renderStatBar("Sp. Atk", pokemon.stats.sp_attack)}
          ${renderStatBar("Sp. Def", pokemon.stats.sp_defense)}
          ${renderStatBar("Speed", pokemon.stats.speed)}
        </div>

        <div class="modal-weakness">
          <h4>Weaknesses</h4>
          ${weaknessesHTML}
        </div>

        <div class="modal-strength">
          <h4>Resistances</h4>
          ${strengthsHTML}
        </div>

        <div class="modal-evolution">
          <h4>Evolution Line</h4>
          <div class="modal-evo-row">
            ${evolutionHTML}
          </div>
        </div>

      </div>

    </div>
  `;

  document.querySelectorAll(".modal-evo").forEach(el => {
    el.addEventListener("click", () => {
      const dex = Number(el.dataset.dex);
      openPokemonModal(dex);
    });
  });
}

// STAT BAR HELPER

function renderStatBar(label, value) {
  const percent = Math.min(value, 150) / 150 * 100;

  const key = label
    .toLowerCase()
    .replace(".", "")
    .replace(" ", "_");

  return `
    <div class="modal-stat">
      <span>${label}</span>
      <div class="modal-stat-bar">
        <div class="modal-stat-fill ${key}" style="width:${percent}%"></div>
      </div>
      <span>${value}</span>
    </div>
  `;
}




