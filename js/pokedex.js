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
    renderCapturePerformance(data.trainer_stats);
    renderJourney(data.trainer_stats);
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

function renderCapturePerformance(stats) {
  const container = document.getElementById("tab-capture");
  const balls = stats.pokeballs;

  const ballOrder = [
    { key: "poke ball", label: "Poke Ball", class: "poke", icon: "https://archives.bulbagarden.net/media/upload/b/b3/Pok%C3%A9_Ball_ZA_Art.png" },
    { key: "great ball", label: "Great Ball", class: "great", icon: "https://archives.bulbagarden.net/media/upload/5/54/Bag_Great_Ball_SV_Sprite.png" },
    { key: "ultra ball", label: "Ultra Ball", class: "ultra", icon: "https://archives.bulbagarden.net/media/upload/5/55/Bag_Ultra_Ball_SV_Sprite.png" },
    { key: "master ball", label: "Master Ball", class: "master", icon: "https://archives.bulbagarden.net/media/upload/a/a6/Bag_Master_Ball_SV_Sprite.png" }
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

function renderBallPieChart(distribution) {
  const ctx = document.getElementById("ballPieChart");

  if (!ctx || !distribution) return;

  const data = [
    distribution["poke ball"] || 0,
    distribution["great ball"] || 0,
    distribution["ultra ball"] || 0,
    distribution["master ball"] || 0
  ];

  new Chart(ctx, {
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


