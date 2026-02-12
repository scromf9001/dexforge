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


# =========================
# MAIN SCRIPT
# =========================

def run():
    # === MIX IT UP INPUTS ===
    raw_pokedex = "$userpokedexall"
    raw_inventory = "$usertrackall"

    username = "$username"
    avatar = "$useravatar"

    user_hours = safe_int("$userhours")
    follow_age = safe_str("$userfollowage")
    sub_age = safe_str("$usersubage")
    total_commands = safe_int("$usertotalcommandsrun")

    # === CSV PATH ===
    pokemon_csv = r"C:\Users\sebas\Desktop\Stream Stuff\Pokemon System\pokemon_list.csv"

    # =========================
    # LOAD POKEMON METADATA
    # =========================

    pokemon_metadata = {}

    with open(pokemon_csv, newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            name_key = safe_str(row.get("name")).lower()
            if not name_key:
                continue
            raw_number = safe_float(row.get("number"))
            if not raw_number.is_integer():
                continue

            pokemon_metadata[name_key] = {
                "name": safe_str(row.get("name")),
                "pokedex_number": safe_int(row.get("pokedex_number")),
                "primary_type": safe_str(row.get("primary_type"), "Unknown"),
                "secondary_type": safe_str(row.get("secondary_type")) or None,

                "generation": safe_int(row.get("generation")),
                "region": safe_str(row.get("region"), "Unknown"),
                "rarity": safe_str(row.get("rarity"), "common"),
                "is_legendary": safe_str(row.get("is_legendary"), "false").lower() == "true",
                "is_mythic": safe_str(row.get("is_mythic"), "false").lower() == "true",


                "evolution": safe_str(row.get("evolution"), "false").lower() == "true",
                "evolution_stage": safe_str(row.get("evolution_stage"), "unknown"),
                "evolution_line_id": safe_str(row.get("evolution_line_id"), name_key),

                "quantity_required": safe_int(row.get("quantity_required"), 0),
                "item_required": safe_str(row.get("item_required"), "no").lower() == "yes",
                "requirement": safe_str(row.get("requirement")),

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
            }

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


            "evolution": meta["evolution"],
            "evolution_stage": meta["evolution_stage"],
            "evolution_line_id": meta["evolution_line_id"],

            "quantity_required": meta["quantity_required"],
            "item_required": meta["item_required"],
            "requirement": meta["requirement"],

            "stats": meta["stats"],
            "physical": meta["physical"],
            "pokedex_entry": meta["pokedex_entry"],

            "image": f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/{meta['pokedex_number']}.svg"
        })

    pokemon_list.sort(key=lambda x: x["pokedex_number"])

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

    # ---- EVOLUTIONS ----
    times_evolved = inventory_stats.get("evolution", 0)

    # ---- TRADES (future proof) ----
    times_traded = inventory_stats.get("trade", 0)


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
            "commands_run": total_commands,
            "times_evolved": times_evolved,
            "times_traded": times_traded
        }
    }



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
        "pokemon": pokemon_list
    }

    return json.dumps(output, indent=2, ensure_ascii=False)


print(run())
