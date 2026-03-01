import csv
import json
from datetime import datetime, timezone


# =========================
# SAFE HELPERS
# =========================

def safe_int(value, default=0):
    try:
        return int(value)
    except:
        return default


def safe_float(value, default=0.0):
    try:
        return float(value)
    except:
        return default


def safe_str(value, default=""):
    if value is None:
        return default
    return str(value).strip()


TYPE_CHART = {
    "normal":  {"weak": ["fighting"], "resist": [], "immune": ["ghost"]},
    "fire":    {"weak": ["water", "ground", "rock"], "resist": ["fire", "grass", "ice", "bug", "steel", "fairy"], "immune": []},
    "water":   {"weak": ["electric", "grass"], "resist": ["fire", "water", "ice", "steel"], "immune": []},
    "grass":   {"weak": ["fire", "ice", "poison", "flying", "bug"], "resist": ["water", "electric", "grass", "ground"], "immune": []},
    "electric":{"weak": ["ground"], "resist": ["electric", "flying", "steel"], "immune": []},
    "ice":     {"weak": ["fire", "fighting", "rock", "steel"], "resist": ["ice"], "immune": []},
    "fighting":{"weak": ["flying", "psychic", "fairy"], "resist": ["bug", "rock", "dark"], "immune": []},
    "poison":  {"weak": ["ground", "psychic"], "resist": ["grass", "fighting", "poison", "bug", "fairy"], "immune": []},
    "ground":  {"weak": ["water", "grass", "ice"], "resist": ["poison", "rock"], "immune": ["electric"]},
    "flying":  {"weak": ["electric", "ice", "rock"], "resist": ["grass", "fighting", "bug"], "immune": ["ground"]},
    "psychic": {"weak": ["bug", "ghost", "dark"], "resist": ["fighting", "psychic"], "immune": []},
    "bug":     {"weak": ["fire", "flying", "rock"], "resist": ["grass", "fighting", "ground"], "immune": []},
    "rock":    {"weak": ["water", "grass", "fighting", "ground", "steel"], "resist": ["normal", "fire", "poison", "flying"], "immune": []},
    "ghost":   {"weak": ["ghost", "dark"], "resist": ["poison", "bug"], "immune": ["normal", "fighting"]},
    "dragon":  {"weak": ["ice", "dragon", "fairy"], "resist": ["fire", "water", "electric", "grass"], "immune": []},
    "dark":    {"weak": ["fighting", "bug", "fairy"], "resist": ["ghost", "dark"], "immune": ["psychic"]},
    "steel":   {"weak": ["fire", "fighting", "ground"], "resist": ["normal", "grass", "ice", "flying", "psychic", "bug", "rock", "dragon", "steel", "fairy"], "immune": ["poison"]},
    "fairy":   {"weak": ["poison", "steel"], "resist": ["fighting", "bug", "dark"], "immune": ["dragon"]}
}


# =========================
# COMPANION CONFIG
# =========================

FRIENDSHIP_REQUIREMENT = 600
BUDDY_FILE_PATH = r"C:\Users\sebas\Desktop\Stream Stuff\Pokemon System\Text Files\buddies.txt"


def calculate_type_matchups(primary, secondary=None):
    primary = primary.lower()
    secondary = secondary.lower() if secondary and secondary.lower() != "null" else None

    all_types = TYPE_CHART.keys()
    results = {}

    for attack_type in all_types:
        multiplier = 1.0

        for defense_type in [primary, secondary]:
            if not defense_type:
                continue

            if defense_type not in TYPE_CHART:
                continue

            chart = TYPE_CHART[defense_type]

            if attack_type in chart["weak"]:
                multiplier *= 2
            elif attack_type in chart["resist"]:
                multiplier *= 0.5
            elif attack_type in chart["immune"]:
                multiplier *= 0

        if multiplier != 1:
            results[attack_type] = multiplier

    weaknesses = []
    strengths = []

    for t, mult in results.items():
        if mult > 1:
            weaknesses.append({"type": t, "multiplier": mult})
        elif mult < 1:
            strengths.append({"type": t, "multiplier": mult})

    return strengths, weaknesses


# =========================
# MAIN SCRIPT
# =========================

def run():
    # === MIX IT UP INPUTS ===
    raw_pokedex = "$userpokedexall"
    raw_inventory = "$usertrackall"
    raw_friendship = "$userpokefriendshipall"

    username = "$username"
    avatar = "$useravatar"

    user_hours = safe_int("$userhours")
    follow_age = safe_str("$userfollowage")
    sub_age = safe_str("$usersubage")
    total_commands = safe_int("$usertotalcommandsrun")

    user_subs_gifted = safe_int("$usertotalsubsgifted")
    user_bits_lifetime = safe_int("$userbitslifetimeamount")
    user_total_donated = safe_float("$usertotalamountdonated")
    user_sub_months = safe_int("$usertotalmonthssubbed")

    user_primary_role = safe_str("$userprimaryrole")
    user_sub_tier = safe_str("$usersubtier")
    user_streams_watched = safe_int("$usertotalstreamswatched")
    user_chat_messages = safe_int("$usertotalchatmessagessent")
    user_times_tagged = safe_int("$usertotaltimestagged")
    raw_pokebag = "$userpokebagall"

    buddy_times_pet = safe_int("$usertrackbuddytimespet")
    buddy_times_fed = safe_int("$usertrackbuddyberriesfed")

    # === CSV PATH ===
    pokemon_csv = r"C:\Users\sebas\Desktop\Stream Stuff\Pokemon System\pokemon_list.csv"

    # =========================
    # LOAD POKEMON METADATA + TRANSITIONS
    # =========================

    pokemon_metadata = {}
    transition_map = {}

    with open(pokemon_csv, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:

            raw_number = safe_float(row.get("number"))
            is_species_row = raw_number.is_integer()

            name_raw = safe_str(row.get("name")).strip()
            name_key = name_raw.lower()

            evolution_raw = safe_str(row.get("evolution")).strip()
            evolution_key = evolution_raw.lower()

            # ---------------------------------------------------
            # HARVEST TRANSITION (ANY ROW THAT HAS EVOLUTION)
            # ---------------------------------------------------
            if evolution_key and evolution_key not in ["null", "none", "false", "0"]:

                transition_map[evolution_key] = {
                    "parent": name_key,
                    "requirement": safe_str(row.get("requirement")).strip(),
                    "quantity_required": safe_int(row.get("quantity_required"), 0),
                    "item_required": safe_str(row.get("item_required"), "no").strip().lower() == "yes"
                }

            # ---------------------------------------------------
            # BUILD REAL SPECIES ONLY FROM INTEGER ROWS
            # ---------------------------------------------------
            if not is_species_row:
                continue

            pokedex_number = safe_int(row.get("pokedex_number"))
            form = safe_str(row.get("form")).lower()

            base_url = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world"

            if form:
                image_url = f"{base_url}/{pokedex_number}-{form}.svg"
            else:
                image_url = f"{base_url}/{pokedex_number}.svg"

            secondary_raw = safe_str(row.get("secondary_type")).lower()
            secondary_type = None if secondary_raw in ["", "null"] else secondary_raw.capitalize()

            pokemon_metadata[name_key] = {
                "name": name_raw,
                "pokedex_number": pokedex_number,
                "primary_type": safe_str(row.get("primary_type"), "Unknown"),
                "secondary_type": secondary_type,
                "generation": safe_int(row.get("generation")),
                "region": safe_str(row.get("region"), "Unknown"),
                "rarity": safe_str(row.get("rarity"), "common"),
                "is_legendary": safe_str(row.get("is_legendary"), "false").lower() == "true",
                "is_mythic": safe_str(row.get("is_mythic"), "false").lower() == "true",
                "is_hatchable": safe_str(row.get("is_hatchable"), "false").lower() == "true",
                "evolution": False,
                "evolution_stage": safe_str(row.get("evolution_stage"), "unknown"),
                "evolution_line_id": safe_str(row.get("evolution_line_id"), name_key),
                "quantity_required": 0,
                "item_required": False,
                "requirement": "",
                "stats": {
                    "hp": safe_int(row.get("hp")),
                    "attack": safe_int(row.get("attack")),
                    "defense": safe_int(row.get("defense")),
                    "sp_attack": safe_int(row.get("sp_attack")),
                    "sp_defense": safe_int(row.get("sp_defense")),
                    "speed": safe_int(row.get("speed")),
                },
                "physical": {
                    "height": safe_float(row.get("height")),
                    "weight": safe_float(row.get("weight")),
                },
                "pokedex_entry": safe_str(row.get("pokedex_entry")),
                "image": image_url
            }

    # =========================
    # PARSE FRIENDSHIP
    # =========================

    friendship_map = {}
    friendship_entries = [f.strip() for f in raw_friendship.split(",") if " x" in f]

    for entry in friendship_entries:
        try:
            line_part, points_part = entry.split(" x", 1)
            friendship_map[safe_str(line_part)] = safe_int(points_part)
        except:
            continue


    # =========================
    # PARSE USER POKEDEX
    # =========================

    owned_counts = {}

    entries = [e.strip() for e in raw_pokedex.split(",") if " x" in e]

    for entry in entries:
        try:
            name_part, count_part = entry.rsplit(" x", 1)
            name = safe_str(name_part)
            count = safe_int(count_part)

            owned_counts[name.lower()] = count
        except:
            continue

    # =========================
    # BUILD FULL POKEDEX
    # =========================

    pokemon_list = []

    for key, meta in pokemon_metadata.items():
        count = owned_counts.get(key, 0)

        pokemon_list.append({
            "name": meta["name"],
            "count": count,
            "owned": count > 0,

            "pokedex_number": meta["pokedex_number"],
            "primary_type": meta["primary_type"],
            "secondary_type": meta["secondary_type"],

            "generation": meta["generation"],
            "region": meta["region"],
            "rarity": meta["rarity"],
            "is_legendary": meta["is_legendary"],
            "is_mythic": meta["is_mythic"],
            "is_hatchable": meta["is_hatchable"],

            "evolution": meta["evolution"],
            "evolution_stage": meta["evolution_stage"],
            "evolution_line_id": meta["evolution_line_id"],

            "quantity_required": meta["quantity_required"],
            "item_required": meta["item_required"],
            "requirement": meta["requirement"],

            "stats": meta["stats"],
            "physical": meta["physical"],
            "pokedex_entry": meta["pokedex_entry"],

            "image": meta["image"]

        })

    pokemon_list.sort(key=lambda x: x["pokedex_number"])

    # ---- FULL EVOLUTION LINES ----

    evolution_line_map = {}

    for p in pokemon_list:
        line_id = p["evolution_line_id"]
        evolution_line_map.setdefault(line_id, []).append(p)

    # sort each line by stage
    for line_id, line in evolution_line_map.items():
        evolution_line_map[line_id] = sorted(
            line,
            key=lambda x: safe_int(x["evolution_stage"], 0)
        )


    # ---- MATCHUPS & EVOLUTION LINE DATA TO EACH POKEMON ----

    for p in pokemon_list:

        strengths, weaknesses = calculate_type_matchups(
            p["primary_type"],
            p["secondary_type"]
        )

        p["strengths"] = strengths
        p["weaknesses"] = weaknesses

        line = evolution_line_map.get(p["evolution_line_id"], [])

        p["evolution_line"] = [
            {
                "name": evo["name"],
                "pokedex_number": evo["pokedex_number"],
                "image": evo["image"],
                "evolution_stage": evo["evolution_stage"]
            }
            for evo in line
        ]



    # =========================
    # PARSE INVENTORY STATS
    # =========================

    inventory_stats = {}

    inventory_entries = [i.strip() for i in raw_inventory.split(",") if " x" in i]

    for item in inventory_entries:
        try:
            name_part, count_part = item.rsplit(" x", 1)
            name = safe_str(name_part).lower()
            count = safe_int(count_part)

            inventory_stats[name] = count
        except:
            continue

    # ---- BALLS ----
    total_balls_thrown = sum(
        count for name, count in inventory_stats.items()
        if "thrown" in name
    )

    total_success = sum(
        count for name, count in inventory_stats.items()
        if "success" in name
    )

    accuracy = round(
        (total_success / total_balls_thrown) * 100, 2
    ) if total_balls_thrown > 0 else 0

    # ---- BALL BREAKDOWN ----

    def build_ball_stats(ball_name):
        thrown = inventory_stats.get(f"{ball_name} thrown", 0)
        success = inventory_stats.get(f"{ball_name} success", 0)
        accuracy = round((success / thrown) * 100, 2) if thrown > 0 else 0

        return {
            "thrown": thrown,
            "success": success,
            "accuracy_percent": accuracy
        }

    poke_ball = build_ball_stats("poke ball")
    great_ball = build_ball_stats("great ball")
    ultra_ball = build_ball_stats("ultra ball")
    master_ball = build_ball_stats("master ball")

    # determine most used
    ball_usage = {
        "poke ball": poke_ball["thrown"],
        "great ball": great_ball["thrown"],
        "ultra ball": ultra_ball["thrown"],
        "master ball": master_ball["thrown"]
    }

    most_used_ball = max(ball_usage, key=ball_usage.get) if ball_usage else None

    # ---- BALL USAGE DISTRIBUTION ----

    ball_distribution = {}

    if total_balls_thrown > 0:
        for ball_name, stats in {
            "poke ball": poke_ball,
            "great ball": great_ball,
            "ultra ball": ultra_ball,
            "master ball": master_ball
        }.items():
            percent = round(
                (stats["thrown"] / total_balls_thrown) * 100, 2
            ) if total_balls_thrown > 0 else 0

            ball_distribution[ball_name] = percent
    else:
        ball_distribution = {
            "poke ball": 0,
            "great ball": 0,
            "ultra ball": 0,
            "master ball": 0
        }


    # ---- EVOLUTIONS ----
    times_evolved = inventory_stats.get("evolution", 0)

    # ---- TRADES ----
    times_traded = inventory_stats.get("trade", 0)

        # ---- EGGS HATCHED ----
    times_eggs_hatched = inventory_stats.get("eggs hatched", 0)


    # ---- POKEBAG CONTENTS ----

    pokebag_contents = {}

    bag_entries = [i.strip() for i in raw_pokebag.split(",") if " x" in i]

    for item in bag_entries:
        try:
            name_part, count_part = item.rsplit(" x", 1)
            name = safe_str(name_part)
            count = safe_int(count_part)

            pokebag_contents[name] = count
        except:
            continue


    # =========================
    # TRAINER STATS
    # =========================

    total_available = len(pokemon_list)

    owned_pokemon = [p for p in pokemon_list if p["owned"]]
    unique_owned = len(owned_pokemon)
    total_owned = sum(p["count"] for p in owned_pokemon)

    completion_percent = round(
        (unique_owned / total_available) * 100, 2
    ) if total_available > 0 else 0


    # ---- GENERATION PROGRESS ----
    generation_progress = {}

    for p in pokemon_list:
        gen = p["generation"]

        # Skip invalid or unknown generations
        if gen <= 0:
            continue

        if gen not in generation_progress:
            generation_progress[gen] = {
                "generation": gen,
                "region": p["region"],
                "owned": 0,
                "total": 0
            }

        generation_progress[gen]["total"] += 1
        if p["owned"]:
            generation_progress[gen]["owned"] += 1


    for gen in generation_progress:
        owned = generation_progress[gen]["owned"]
        total = generation_progress[gen]["total"]

        generation_progress[gen]["completion_percent"] = round(
            (owned / total) * 100, 2
        ) if total > 0 else 0

    generation_progress = dict(sorted(generation_progress.items()))




    # ---- EVOLUTION PROGRESS ----
    evolution_lines = {}
    evolvable_owned = 0

    for p in pokemon_list:
        line_id = p["evolution_line_id"]
        evolution_lines.setdefault(line_id, []).append(p)

        if p["owned"] and p["quantity_required"] > 0 and p["count"] >= p["quantity_required"]:
            evolvable_owned += 1

    total_evolution_lines = len(evolution_lines)

    lines_completed = 0

    for line in evolution_lines.values():
        if all(p["owned"] for p in line):
            lines_completed += 1

    evolution_stage_counts = {}

    for p in owned_pokemon:
        stage = p["evolution_stage"]
        evolution_stage_counts[stage] = evolution_stage_counts.get(stage, 0) + 1

    stage_totals = {}
    stage_owned = {}

    total_evolutions_available = 0
    total_evolutions_owned = 0

    for p in pokemon_list:
        stage = safe_int(p["evolution_stage"], 0)

        if stage > 0:
            total_evolutions_available += 1
            stage_totals[stage] = stage_totals.get(stage, 0) + 1

            if p["owned"]:
                total_evolutions_owned += 1
                stage_owned[stage] = stage_owned.get(stage, 0) + 1

    # =========================
    # ENRICH POKEMON WITH EVOLUTION FLAGS
    # =========================

    # 1️⃣ Determine which evolution lines are complete
    line_completion_map = {}

    for line_id, line in evolution_lines.items():
        is_complete = all(p["owned"] for p in line)
        line_completion_map[line_id] = is_complete


    # 2️⃣ Enrich each Pokémon
    for p in pokemon_list:

        # Normalize stage to int (important for filtering)
        stage_int = safe_int(p["evolution_stage"], 0)

        if stage_int == 4:
            p["evolution_stage"] = "mega"
        else:
            p["evolution_stage"] = stage_int


        # Line complete flag
        p["line_complete"] = line_completion_map.get(
            p["evolution_line_id"], False
        )
        

        # =========================
        # INJECT TRANSITION REQUIREMENT (CHILD-SIDE)
        # =========================

        species_key = safe_str(p["name"]).strip().lower()

        # --- Defaults ---
        p["requirement"] = ""
        p["item_required"] = False
        p["quantity_required"] = 0
        p["evolvable_now"] = False
        requirement_text = ""

        # --------------------------------------------------
        # CHILD LOGIC → requirement lives on the child
        # --------------------------------------------------
        if species_key in transition_map:
            transition = transition_map[species_key]

            p["requirement"] = transition["requirement"]
            p["item_required"] = transition["item_required"]

            requirement_text = safe_str(transition["requirement"]).strip().lower()

        p["requires_stone"] = "stone" in requirement_text
        p["requires_trade"] = "trade" in requirement_text


        # --------------------------------------------------
        # PARENT LOGIC → quantity + evolvable live here
        # --------------------------------------------------

        # Find all children of this Pokémon
        children = [
            transition
            for transition in transition_map.values()
            if transition["parent"] == species_key
        ]

        if children:

            # Use MINIMUM quantity required across children
            min_required = min(
                t["quantity_required"]
                for t in children
                if t["quantity_required"] > 0
            ) if any(t["quantity_required"] > 0 for t in children) else 0

            p["quantity_required"] = min_required

            if (
                p["owned"]
                and min_required > 0
                and p["count"] >= min_required
            ):
                p["evolvable_now"] = True

        # =========================
        # FRIENDSHIP ENRICHMENT
        # =========================

        line_id = safe_str(p["evolution_line_id"])
        friendship_points = friendship_map.get(line_id, 0)

        p["friendship_points"] = friendship_points

        if "friendship" in requirement_text:

            percent = round(
                min((friendship_points / FRIENDSHIP_REQUIREMENT) * 100, 100),
                2
            ) if FRIENDSHIP_REQUIREMENT > 0 else 0

            p["friendship_requirement"] = FRIENDSHIP_REQUIREMENT
            p["friendship_progress_percent"] = percent


    # ---- REGION EVOLUTION LINES ----
    region_lines = {}

    for line in evolution_lines.values():
        region = line[0]["region"]
        region_lines.setdefault(region, []).append(line)

    for gen in generation_progress.values():
        region = gen["region"]
        lines = region_lines.get(region, [])

        gen["total_lines"] = len(lines)
        gen["lines_completed"] = sum(
            1 for line in lines if all(p["owned"] for p in line)
        )

    # ---- TYPE MASTERY ----
    type_progress = {}

    for p in pokemon_list:
        t = p["primary_type"].lower()
        type_progress.setdefault(t, {"owned": 0, "total": 0})

        type_progress[t]["total"] += 1
        if p["owned"]:
            type_progress[t]["owned"] += 1

    for t, data in type_progress.items():
        data["completion_percent"] = round(
            (data["owned"] / data["total"]) * 100, 2
        ) if data["total"] > 0 else 0


    # ---- RARITY ----
    rarity_progress = {}

    for p in pokemon_list:
        r = p["rarity"].lower()
        rarity_progress.setdefault(r, {"owned": 0, "total": 0})

        rarity_progress[r]["total"] += 1
        if p["owned"]:
            rarity_progress[r]["owned"] += 1

    total_legendary_available = 0
    total_legendary_owned = 0

    for p in pokemon_list:
        if p.get("is_legendary") or p.get("is_mythic"):

            total_legendary_available += 1

            if p["owned"]:
                total_legendary_owned += 1


    # ---- FINAL TRAINER STATS OBJECT ----
    trainer_stats = {
        "pokedex": {
            "total_available": total_available,
            "unique_owned": unique_owned,
            "total_owned": total_owned,
            "completion_percent": completion_percent
        },

        "generation_progress": generation_progress,

        "evolution": {
            "total_evolutions_owned": total_evolutions_owned,
            "total_evolutions_available": total_evolutions_available,
            "lines_completed": lines_completed,
            "total_lines": total_evolution_lines,
            "stage_totals": stage_totals,
            "stage_owned": stage_owned
        },

        "types": type_progress,

        "legendary": {
            "owned": total_legendary_owned,
            "total": total_legendary_available
        },

        "pokeballs": {
            "thrown": total_balls_thrown,
            "success": total_success,
            "accuracy_percent": accuracy,
            "most_used": most_used_ball,
            "details": {
                "poke ball": poke_ball,
                "great ball": great_ball,
                "ultra ball": ultra_ball,
                "master ball": master_ball
            }
        },

        "journey": {
            "watch_hours": user_hours,
            "follow_age": follow_age or "Unknown",
            "sub_age": sub_age or "Not Subscribed",
            "sub_months": user_sub_months,
            "subs_gifted": user_subs_gifted,
            "bits_donated": user_bits_lifetime,
            "total_donated": user_total_donated,
            "primary_role": user_primary_role,
            "sub_tier": user_sub_tier,
            "streams_watched": user_streams_watched,
            "chat_messages": user_chat_messages,
            "commands_run": total_commands,
            "times_tagged": user_times_tagged,
            "times_evolved": times_evolved,
            "times_traded": times_traded,
            "times_eggs_hatched": times_eggs_hatched,
            "ball_distribution": ball_distribution,
            "pokebag": pokebag_contents
        }
    }

    # =========================
    # BUILD COMPANION OBJECT
    # =========================

    companion = None

    try:
        with open(BUDDY_FILE_PATH, "r", encoding="utf-8") as buddy_file:
            for line in buddy_file:
                parts = line.strip().split()

                if len(parts) < 4:
                    continue

                file_username = parts[0]

                if file_username.lower() != username.lower():
                    continue

                companion_line_id = safe_str(parts[2])

                for p in pokemon_list:
                    if safe_str(p["evolution_line_id"]) == companion_line_id:

                        companion = {
                            "name": p["name"],
                            "pokedex_number": p["pokedex_number"],
                            "image": p["image"],
                            "primary_type": p["primary_type"],
                            "secondary_type": p["secondary_type"],
                            "evolution_line_id": companion_line_id,
                            "friendship_points": p["friendship_points"],
                            "times_pet": buddy_times_pet,
                            "times_fed": buddy_times_fed
                        }

                        if "friendship_requirement" in p:
                            companion["friendship_requirement"] = p["friendship_requirement"]
                            companion["friendship_progress_percent"] = p["friendship_progress_percent"]

                        break

                break
    except:
        companion = None


    # =========================
    # FINAL OUTPUT
    # =========================

    output = {
        "user": {
            "username": username,
            "avatar": avatar
        },
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "trainer_stats": trainer_stats,
        "pokemon": pokemon_list,
        "companion": companion
    }

    return json.dumps(output, indent=2, ensure_ascii=False)


print(run())
