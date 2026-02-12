"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Gamepad2,
  RefreshCw,
  Unlink,
  CheckCircle,
  AlertCircle,
  Trophy,
  ExternalLink,
  Search,
} from "lucide-react";

// WoW Realms by region
const REALMS: Record<"us" | "eu" | "kr" | "tw", Array<{ name: string; slug: string }>> = {
  us: [
    { name: "Aegwynn", slug: "aegwynn" },
    { name: "Aerie Peak", slug: "aerie-peak" },
    { name: "Agamaggan", slug: "agamaggan" },
    { name: "Aggramar", slug: "aggramar" },
    { name: "Akama", slug: "akama" },
    { name: "Alexstrasza", slug: "alexstrasza" },
    { name: "Alleria", slug: "alleria" },
    { name: "Altar of Storms", slug: "altar-of-storms" },
    { name: "Alterac Mountains", slug: "alterac-mountains" },
    { name: "Aman'Thul", slug: "amanthul" },
    { name: "Andorhal", slug: "andorhal" },
    { name: "Anetheron", slug: "anetheron" },
    { name: "Antonidas", slug: "antonidas" },
    { name: "Anub'arak", slug: "anubarak" },
    { name: "Anvilmar", slug: "anvilmar" },
    { name: "Arathor", slug: "arathor" },
    { name: "Archimonde", slug: "archimonde" },
    { name: "Area 52", slug: "area-52" },
    { name: "Argent Dawn", slug: "argent-dawn" },
    { name: "Arthas", slug: "arthas" },
    { name: "Arygos", slug: "arygos" },
    { name: "Auchindoun", slug: "auchindoun" },
    { name: "Azgalor", slug: "azgalor" },
    { name: "Azjol-Nerub", slug: "azjol-nerub" },
    { name: "Azralon", slug: "azralon" },
    { name: "Azshara", slug: "azshara" },
    { name: "Azuremyst", slug: "azuremyst" },
    { name: "Baelgun", slug: "baelgun" },
    { name: "Balnazzar", slug: "balnazzar" },
    { name: "Barthilas", slug: "barthilas" },
    { name: "Black Dragonflight", slug: "black-dragonflight" },
    { name: "Blackhand", slug: "blackhand" },
    { name: "Blackrock", slug: "blackrock" },
    { name: "Blackwater Raiders", slug: "blackwater-raiders" },
    { name: "Blackwing Lair", slug: "blackwing-lair" },
    { name: "Blade's Edge", slug: "blades-edge" },
    { name: "Bladefist", slug: "bladefist" },
    { name: "Bleeding Hollow", slug: "bleeding-hollow" },
    { name: "Blood Furnace", slug: "blood-furnace" },
    { name: "Bloodhoof", slug: "bloodhoof" },
    { name: "Bloodscalp", slug: "bloodscalp" },
    { name: "Bonechewer", slug: "bonechewer" },
    { name: "Borean Tundra", slug: "borean-tundra" },
    { name: "Boulderfist", slug: "boulderfist" },
    { name: "Bronzebeard", slug: "bronzebeard" },
    { name: "Burning Blade", slug: "burning-blade" },
    { name: "Burning Legion", slug: "burning-legion" },
    { name: "Caelestrasz", slug: "caelestrasz" },
    { name: "Cairne", slug: "cairne" },
    { name: "Cenarion Circle", slug: "cenarion-circle" },
    { name: "Cenarius", slug: "cenarius" },
    { name: "Cho'gall", slug: "chogall" },
    { name: "Chromaggus", slug: "chromaggus" },
    { name: "Coilfang", slug: "coilfang" },
    { name: "Crushridge", slug: "crushridge" },
    { name: "Daggerspine", slug: "daggerspine" },
    { name: "Dalaran", slug: "dalaran" },
    { name: "Dalvengyr", slug: "dalvengyr" },
    { name: "Dark Iron", slug: "dark-iron" },
    { name: "Darkspear", slug: "darkspear" },
    { name: "Darrowmere", slug: "darrowmere" },
    { name: "Dath'Remar", slug: "dathremar" },
    { name: "Dawnbringer", slug: "dawnbringer" },
    { name: "Deathwing", slug: "deathwing" },
    { name: "Demon Soul", slug: "demon-soul" },
    { name: "Dentarg", slug: "dentarg" },
    { name: "Destromath", slug: "destromath" },
    { name: "Dethecus", slug: "dethecus" },
    { name: "Detheroc", slug: "detheroc" },
    { name: "Doomhammer", slug: "doomhammer" },
    { name: "Draenor", slug: "draenor" },
    { name: "Dragonblight", slug: "dragonblight" },
    { name: "Dragonmaw", slug: "dragonmaw" },
    { name: "Drak'Tharon", slug: "draktharon" },
    { name: "Drak'thul", slug: "drakthul" },
    { name: "Draka", slug: "draka" },
    { name: "Drenden", slug: "drenden" },
    { name: "Dunemaul", slug: "dunemaul" },
    { name: "Durotan", slug: "durotan" },
    { name: "Duskwood", slug: "duskwood" },
    { name: "Earthen Ring", slug: "earthen-ring" },
    { name: "Echo Isles", slug: "echo-isles" },
    { name: "Eitrigg", slug: "eitrigg" },
    { name: "Eldre'Thalas", slug: "eldrethalas" },
    { name: "Elune", slug: "elune" },
    { name: "Emerald Dream", slug: "emerald-dream" },
    { name: "Eonar", slug: "eonar" },
    { name: "Eredar", slug: "eredar" },
    { name: "Executus", slug: "executus" },
    { name: "Exodar", slug: "exodar" },
    { name: "Farstriders", slug: "farstriders" },
    { name: "Feathermoon", slug: "feathermoon" },
    { name: "Fenris", slug: "fenris" },
    { name: "Firetree", slug: "firetree" },
    { name: "Fizzcrank", slug: "fizzcrank" },
    { name: "Frostmane", slug: "frostmane" },
    { name: "Frostmourne", slug: "frostmourne" },
    { name: "Frostwolf", slug: "frostwolf" },
    { name: "Galakrond", slug: "galakrond" },
    { name: "Gallywix", slug: "gallywix" },
    { name: "Garithos", slug: "garithos" },
    { name: "Garona", slug: "garona" },
    { name: "Garrosh", slug: "garrosh" },
    { name: "Ghostlands", slug: "ghostlands" },
    { name: "Gilneas", slug: "gilneas" },
    { name: "Gnomeregan", slug: "gnomeregan" },
    { name: "Goldrinn", slug: "goldrinn" },
    { name: "Gorefiend", slug: "gorefiend" },
    { name: "Gorgonnash", slug: "gorgonnash" },
    { name: "Greymane", slug: "greymane" },
    { name: "Grizzly Hills", slug: "grizzly-hills" },
    { name: "Gul'dan", slug: "guldan" },
    { name: "Gundrak", slug: "gundrak" },
    { name: "Gurubashi", slug: "gurubashi" },
    { name: "Hakkar", slug: "hakkar" },
    { name: "Haomarush", slug: "haomarush" },
    { name: "Hellscream", slug: "hellscream" },
    { name: "Hydraxis", slug: "hydraxis" },
    { name: "Hyjal", slug: "hyjal" },
    { name: "Icecrown", slug: "icecrown" },
    { name: "Illidan", slug: "illidan" },
    { name: "Jaedenar", slug: "jaedenar" },
    { name: "Jubei'Thos", slug: "jubeithos" },
    { name: "Kael'thas", slug: "kaelthas" },
    { name: "Kalecgos", slug: "kalecgos" },
    { name: "Kargath", slug: "kargath" },
    { name: "Kel'Thuzad", slug: "kelthuzad" },
    { name: "Khadgar", slug: "khadgar" },
    { name: "Khaz Modan", slug: "khaz-modan" },
    { name: "Khaz'goroth", slug: "khazgoroth" },
    { name: "Kil'jaeden", slug: "kiljaeden" },
    { name: "Kilrogg", slug: "kilrogg" },
    { name: "Kirin Tor", slug: "kirin-tor" },
    { name: "Korgath", slug: "korgath" },
    { name: "Korialstrasz", slug: "korialstrasz" },
    { name: "Kul Tiras", slug: "kul-tiras" },
    { name: "Laughing Skull", slug: "laughing-skull" },
    { name: "Lethon", slug: "lethon" },
    { name: "Lightbringer", slug: "lightbringer" },
    { name: "Lightning's Blade", slug: "lightnings-blade" },
    { name: "Lightninghoof", slug: "lightninghoof" },
    { name: "Llane", slug: "llane" },
    { name: "Lothar", slug: "lothar" },
    { name: "Madoran", slug: "madoran" },
    { name: "Maelstrom", slug: "maelstrom" },
    { name: "Magtheridon", slug: "magtheridon" },
    { name: "Maiev", slug: "maiev" },
    { name: "Mal'Ganis", slug: "malganis" },
    { name: "Malfurion", slug: "malfurion" },
    { name: "Malorne", slug: "malorne" },
    { name: "Malygos", slug: "malygos" },
    { name: "Mannoroth", slug: "mannoroth" },
    { name: "Medivh", slug: "medivh" },
    { name: "Misha", slug: "misha" },
    { name: "Mok'Nathal", slug: "moknathal" },
    { name: "Moon Guard", slug: "moon-guard" },
    { name: "Moonrunner", slug: "moonrunner" },
    { name: "Mug'thol", slug: "mugthol" },
    { name: "Muradin", slug: "muradin" },
    { name: "Nagrand", slug: "nagrand" },
    { name: "Nathrezim", slug: "nathrezim" },
    { name: "Nazgrel", slug: "nazgrel" },
    { name: "Nazjatar", slug: "nazjatar" },
    { name: "Nemesis", slug: "nemesis" },
    { name: "Ner'zhul", slug: "nerzhul" },
    { name: "Nesingwary", slug: "nesingwary" },
    { name: "Nordrassil", slug: "nordrassil" },
    { name: "Norgannon", slug: "norgannon" },
    { name: "Onyxia", slug: "onyxia" },
    { name: "Perenolde", slug: "perenolde" },
    { name: "Proudmoore", slug: "proudmoore" },
    { name: "Quel'dorei", slug: "queldorei" },
    { name: "Quel'Thalas", slug: "quelthalas" },
    { name: "Ragnaros", slug: "ragnaros" },
    { name: "Ravencrest", slug: "ravencrest" },
    { name: "Ravenholdt", slug: "ravenholdt" },
    { name: "Rexxar", slug: "rexxar" },
    { name: "Rivendare", slug: "rivendare" },
    { name: "Runetotem", slug: "runetotem" },
    { name: "Sargeras", slug: "sargeras" },
    { name: "Saurfang", slug: "saurfang" },
    { name: "Scarlet Crusade", slug: "scarlet-crusade" },
    { name: "Scilla", slug: "scilla" },
    { name: "Sen'jin", slug: "senjin" },
    { name: "Sentinels", slug: "sentinels" },
    { name: "Shadow Council", slug: "shadow-council" },
    { name: "Shadowmoon", slug: "shadowmoon" },
    { name: "Shadowsong", slug: "shadowsong" },
    { name: "Shandris", slug: "shandris" },
    { name: "Shattered Halls", slug: "shattered-halls" },
    { name: "Shattered Hand", slug: "shattered-hand" },
    { name: "Shu'halo", slug: "shuhalo" },
    { name: "Silver Hand", slug: "silver-hand" },
    { name: "Silvermoon", slug: "silvermoon" },
    { name: "Sisters of Elune", slug: "sisters-of-elune" },
    { name: "Skullcrusher", slug: "skullcrusher" },
    { name: "Skywall", slug: "skywall" },
    { name: "Smolderthorn", slug: "smolderthorn" },
    { name: "Spinebreaker", slug: "spinebreaker" },
    { name: "Spirestone", slug: "spirestone" },
    { name: "Staghelm", slug: "staghelm" },
    { name: "Steamwheedle Cartel", slug: "steamwheedle-cartel" },
    { name: "Stonemaul", slug: "stonemaul" },
    { name: "Stormrage", slug: "stormrage" },
    { name: "Stormreaver", slug: "stormreaver" },
    { name: "Stormscale", slug: "stormscale" },
    { name: "Suramar", slug: "suramar" },
    { name: "Tanaris", slug: "tanaris" },
    { name: "Terenas", slug: "terenas" },
    { name: "Terokkar", slug: "terokkar" },
    { name: "Thaurissan", slug: "thaurissan" },
    { name: "The Forgotten Coast", slug: "the-forgotten-coast" },
    { name: "The Scryers", slug: "the-scryers" },
    { name: "The Underbog", slug: "the-underbog" },
    { name: "The Venture Co", slug: "the-venture-co" },
    { name: "Thorium Brotherhood", slug: "thorium-brotherhood" },
    { name: "Thrall", slug: "thrall" },
    { name: "Thunderhorn", slug: "thunderhorn" },
    { name: "Thunderlord", slug: "thunderlord" },
    { name: "Tichondrius", slug: "tichondrius" },
    { name: "Tol Barad", slug: "tol-barad" },
    { name: "Tortheldrin", slug: "tortheldrin" },
    { name: "Trollbane", slug: "trollbane" },
    { name: "Turalyon", slug: "turalyon" },
    { name: "Twisting Nether", slug: "twisting-nether" },
    { name: "Uldaman", slug: "uldaman" },
    { name: "Uldum", slug: "uldum" },
    { name: "Undermine", slug: "undermine" },
    { name: "Ursin", slug: "ursin" },
    { name: "Uther", slug: "uther" },
    { name: "Vashj", slug: "vashj" },
    { name: "Vek'nilash", slug: "veknilash" },
    { name: "Velen", slug: "velen" },
    { name: "Warsong", slug: "warsong" },
    { name: "Whisperwind", slug: "whisperwind" },
    { name: "Wildhammer", slug: "wildhammer" },
    { name: "Windrunner", slug: "windrunner" },
    { name: "Winterhoof", slug: "winterhoof" },
    { name: "Wyrmrest Accord", slug: "wyrmrest-accord" },
    { name: "Ysera", slug: "ysera" },
    { name: "Ysondre", slug: "ysondre" },
    { name: "Zangarmarsh", slug: "zangarmarsh" },
    { name: "Zul'jin", slug: "zuljin" },
    { name: "Zuluhed", slug: "zuluhed" },
  ],
  eu: [
    { name: "Aegwynn", slug: "aegwynn" },
    { name: "Aerie Peak", slug: "aerie-peak" },
    { name: "Agamaggan", slug: "agamaggan" },
    { name: "Aggra (Português)", slug: "aggra-portugues" },
    { name: "Aggramar", slug: "aggramar" },
    { name: "Ahn'Qiraj", slug: "ahnqiraj" },
    { name: "Al'Akir", slug: "alakir" },
    { name: "Alexstrasza", slug: "alexstrasza" },
    { name: "Alleria", slug: "alleria" },
    { name: "Alonsus", slug: "alonsus" },
    { name: "Aman'Thul", slug: "amanthul" },
    { name: "Ambossar", slug: "ambossar" },
    { name: "Anachronos", slug: "anachronos" },
    { name: "Anetheron", slug: "anetheron" },
    { name: "Antonidas", slug: "antonidas" },
    { name: "Anub'arak", slug: "anubarak" },
    { name: "Arak-arahm", slug: "arak-arahm" },
    { name: "Arathi", slug: "arathi" },
    { name: "Arathor", slug: "arathor" },
    { name: "Archimonde", slug: "archimonde" },
    { name: "Area 52", slug: "area-52" },
    { name: "Argent Dawn", slug: "argent-dawn" },
    { name: "Arthas", slug: "arthas" },
    { name: "Arygos", slug: "arygos" },
    { name: "Aszune", slug: "aszune" },
    { name: "Auchindoun", slug: "auchindoun" },
    { name: "Azjol-Nerub", slug: "azjol-nerub" },
    { name: "Azshara", slug: "azshara" },
    { name: "Azuremyst", slug: "azuremyst" },
    { name: "Baelgun", slug: "baelgun" },
    { name: "Balnazzar", slug: "balnazzar" },
    { name: "Blackhand", slug: "blackhand" },
    { name: "Blackmoore", slug: "blackmoore" },
    { name: "Blackrock", slug: "blackrock" },
    { name: "Blade's Edge", slug: "blades-edge" },
    { name: "Bladefist", slug: "bladefist" },
    { name: "Bloodfeather", slug: "bloodfeather" },
    { name: "Bloodhoof", slug: "bloodhoof" },
    { name: "Bloodscalp", slug: "bloodscalp" },
    { name: "Blutkessel", slug: "blutkessel" },
    { name: "Boulderfist", slug: "boulderfist" },
    { name: "Bronze Dragonflight", slug: "bronze-dragonflight" },
    { name: "Bronzebeard", slug: "bronzebeard" },
    { name: "Burning Blade", slug: "burning-blade" },
    { name: "Burning Legion", slug: "burning-legion" },
    { name: "Burning Steppes", slug: "burning-steppes" },
    { name: "C'Thun", slug: "cthun" },
    { name: "Chamber of Aspects", slug: "chamber-of-aspects" },
    { name: "Chants éternels", slug: "chants-eternels" },
    { name: "Cho'gall", slug: "chogall" },
    { name: "Chromaggus", slug: "chromaggus" },
    { name: "Colinas Pardas", slug: "colinas-pardas" },
    { name: "Confrérie du Thorium", slug: "confrerie-du-thorium" },
    { name: "Conseil des Ombres", slug: "conseil-des-ombres" },
    { name: "Crushridge", slug: "crushridge" },
    { name: "Culte de la Rive noire", slug: "culte-de-la-rive-noire" },
    { name: "Daggerspine", slug: "daggerspine" },
    { name: "Dalaran", slug: "dalaran" },
    { name: "Dalvengyr", slug: "dalvengyr" },
    { name: "Darkmoon Faire", slug: "darkmoon-faire" },
    { name: "Darksorrow", slug: "darksorrow" },
    { name: "Darkspear", slug: "darkspear" },
    { name: "Das Konsortium", slug: "das-konsortium" },
    { name: "Das Syndikat", slug: "das-syndikat" },
    { name: "Deathguard", slug: "deathguard" },
    { name: "Deathweaver", slug: "deathweaver" },
    { name: "Deathwing", slug: "deathwing" },
    { name: "Defias Brotherhood", slug: "defias-brotherhood" },
    { name: "Dentarg", slug: "dentarg" },
    { name: "Der Mithrilorden", slug: "der-mithrilorden" },
    { name: "Der Rat von Dalaran", slug: "der-rat-von-dalaran" },
    { name: "Der abyssische Rat", slug: "der-abyssische-rat" },
    { name: "Destromath", slug: "destromath" },
    { name: "Dethecus", slug: "dethecus" },
    { name: "Die Aldor", slug: "die-aldor" },
    { name: "Die Arguswacht", slug: "die-arguswacht" },
    { name: "Die Nachtwache", slug: "die-nachtwache" },
    { name: "Die Silberne Hand", slug: "die-silberne-hand" },
    { name: "Die Todeskrallen", slug: "die-todeskrallen" },
    { name: "Die ewige Wacht", slug: "die-ewige-wacht" },
    { name: "Doomhammer", slug: "doomhammer" },
    { name: "Draenor", slug: "draenor" },
    { name: "Dragonblight", slug: "dragonblight" },
    { name: "Dragonmaw", slug: "dragonmaw" },
    { name: "Drak'thul", slug: "drakthul" },
    { name: "Drek'Thar", slug: "drekthar" },
    { name: "Dun Modr", slug: "dun-modr" },
    { name: "Dun Morogh", slug: "dun-morogh" },
    { name: "Dunemaul", slug: "dunemaul" },
    { name: "Durotan", slug: "durotan" },
    { name: "Earthen Ring", slug: "earthen-ring" },
    { name: "Echsenkessel", slug: "echsenkessel" },
    { name: "Eitrigg", slug: "eitrigg" },
    { name: "Eldre'Thalas", slug: "eldrethalas" },
    { name: "Elune", slug: "elune" },
    { name: "Emerald Dream", slug: "emerald-dream" },
    { name: "Emeriss", slug: "emeriss" },
    { name: "Eonar", slug: "eonar" },
    { name: "Eredar", slug: "eredar" },
    { name: "Executus", slug: "executus" },
    { name: "Exodar", slug: "exodar" },
    { name: "Festung der Stürme", slug: "festung-der-sturme" },
    { name: "Forscherliga", slug: "forscherliga" },
    { name: "Frostmane", slug: "frostmane" },
    { name: "Frostmourne", slug: "frostmourne" },
    { name: "Frostwhisper", slug: "frostwhisper" },
    { name: "Frostwolf", slug: "frostwolf" },
    { name: "Garona", slug: "garona" },
    { name: "Garrosh", slug: "garrosh" },
    { name: "Genjuros", slug: "genjuros" },
    { name: "Ghostlands", slug: "ghostlands" },
    { name: "Gilneas", slug: "gilneas" },
    { name: "Gorgonnash", slug: "gorgonnash" },
    { name: "Grim Batol", slug: "grim-batol" },
    { name: "Gul'dan", slug: "guldan" },
    { name: "Hakkar", slug: "hakkar" },
    { name: "Haomarush", slug: "haomarush" },
    { name: "Hellfire", slug: "hellfire" },
    { name: "Hellscream", slug: "hellscream" },
    { name: "Howling Fjord", slug: "howling-fjord" },
    { name: "Hyjal", slug: "hyjal" },
    { name: "Illidan", slug: "illidan" },
    { name: "Jaedenar", slug: "jaedenar" },
    { name: "Kael'thas", slug: "kaelthas" },
    { name: "Karazhan", slug: "karazhan" },
    { name: "Kargath", slug: "kargath" },
    { name: "Kazzak", slug: "kazzak" },
    { name: "Kel'Thuzad", slug: "kelthuzad" },
    { name: "Khadgar", slug: "khadgar" },
    { name: "Khaz Modan", slug: "khaz-modan" },
    { name: "Khaz'goroth", slug: "khazgoroth" },
    { name: "Kil'jaeden", slug: "kiljaeden" },
    { name: "Kilrogg", slug: "kilrogg" },
    { name: "Kirin Tor", slug: "kirin-tor" },
    { name: "Kor'gall", slug: "korgall" },
    { name: "Krag'jin", slug: "kragjin" },
    { name: "Krasus", slug: "krasus" },
    { name: "Kul Tiras", slug: "kul-tiras" },
    { name: "Kult der Verdammten", slug: "kult-der-verdammten" },
    { name: "La Croisade écarlate", slug: "la-croisade-ecarlate" },
    { name: "Laughing Skull", slug: "laughing-skull" },
    { name: "Les Clairvoyants", slug: "les-clairvoyants" },
    { name: "Les Sentinelles", slug: "les-sentinelles" },
    { name: "Lightbringer", slug: "lightbringer" },
    { name: "Lightning's Blade", slug: "lightnings-blade" },
    { name: "Lordaeron", slug: "lordaeron" },
    { name: "Los Errantes", slug: "los-errantes" },
    { name: "Lothar", slug: "lothar" },
    { name: "Madmortem", slug: "madmortem" },
    { name: "Magtheridon", slug: "magtheridon" },
    { name: "Mal'Ganis", slug: "malganis" },
    { name: "Malfurion", slug: "malfurion" },
    { name: "Malorne", slug: "malorne" },
    { name: "Malygos", slug: "malygos" },
    { name: "Mannoroth", slug: "mannoroth" },
    { name: "Marécage de Zangar", slug: "marecage-de-zangar" },
    { name: "Mazrigos", slug: "mazrigos" },
    { name: "Medivh", slug: "medivh" },
    { name: "Minahonda", slug: "minahonda" },
    { name: "Moonglade", slug: "moonglade" },
    { name: "Mug'thol", slug: "mugthol" },
    { name: "Nagrand", slug: "nagrand" },
    { name: "Nathrezim", slug: "nathrezim" },
    { name: "Naxxramas", slug: "naxxramas" },
    { name: "Nazjatar", slug: "nazjatar" },
    { name: "Nefarian", slug: "nefarian" },
    { name: "Nemesis", slug: "nemesis" },
    { name: "Neptulon", slug: "neptulon" },
    { name: "Ner'zhul", slug: "nerzhul" },
    { name: "Nera'thor", slug: "nerathor" },
    { name: "Nethersturm", slug: "nethersturm" },
    { name: "Nordrassil", slug: "nordrassil" },
    { name: "Norgannon", slug: "norgannon" },
    { name: "Nozdormu", slug: "nozdormu" },
    { name: "Onyxia", slug: "onyxia" },
    { name: "Outland", slug: "outland" },
    { name: "Perenolde", slug: "perenolde" },
    { name: "Proudmoore", slug: "proudmoore" },
    { name: "Quel'Thalas", slug: "quelthalas" },
    { name: "Ragnaros", slug: "ragnaros" },
    { name: "Rajaxx", slug: "rajaxx" },
    { name: "Rashgarroth", slug: "rashgarroth" },
    { name: "Ravencrest", slug: "ravencrest" },
    { name: "Ravenholdt", slug: "ravenholdt" },
    { name: "Rexxar", slug: "rexxar" },
    { name: "Runetotem", slug: "runetotem" },
    { name: "Sanguino", slug: "sanguino" },
    { name: "Sargeras", slug: "sargeras" },
    { name: "Saurfang", slug: "saurfang" },
    { name: "Scarshield Legion", slug: "scarshield-legion" },
    { name: "Sen'jin", slug: "senjin" },
    { name: "Shadowsong", slug: "shadowsong" },
    { name: "Shattered Halls", slug: "shattered-halls" },
    { name: "Shattered Hand", slug: "shattered-hand" },
    { name: "Shattrath", slug: "shattrath" },
    { name: "Shen'dralar", slug: "shendralar" },
    { name: "Silvermoon", slug: "silvermoon" },
    { name: "Sinstralis", slug: "sinstralis" },
    { name: "Skullcrusher", slug: "skullcrusher" },
    { name: "Spinebreaker", slug: "spinebreaker" },
    { name: "Sporeggar", slug: "sporeggar" },
    { name: "Steamwheedle Cartel", slug: "steamwheedle-cartel" },
    { name: "Stormrage", slug: "stormrage" },
    { name: "Stormreaver", slug: "stormreaver" },
    { name: "Stormscale", slug: "stormscale" },
    { name: "Sunstrider", slug: "sunstrider" },
    { name: "Suramar", slug: "suramar" },
    { name: "Sylvanas", slug: "sylvanas" },
    { name: "Taerar", slug: "taerar" },
    { name: "Talnivarr", slug: "talnivarr" },
    { name: "Tarren Mill", slug: "tarren-mill" },
    { name: "Teldrassil", slug: "teldrassil" },
    { name: "Temple noir", slug: "temple-noir" },
    { name: "Terenas", slug: "terenas" },
    { name: "Terokkar", slug: "terokkar" },
    { name: "Terrordar", slug: "terrordar" },
    { name: "The Maelstrom", slug: "the-maelstrom" },
    { name: "The Sha'tar", slug: "the-shatar" },
    { name: "The Venture Co", slug: "the-venture-co" },
    { name: "Theradras", slug: "theradras" },
    { name: "Thrall", slug: "thrall" },
    { name: "Throk'Feroth", slug: "throkferoth" },
    { name: "Thunderhorn", slug: "thunderhorn" },
    { name: "Tichondrius", slug: "tichondrius" },
    { name: "Tirion", slug: "tirion" },
    { name: "Todeswache", slug: "todeswache" },
    { name: "Trollbane", slug: "trollbane" },
    { name: "Turalyon", slug: "turalyon" },
    { name: "Twilight's Hammer", slug: "twilights-hammer" },
    { name: "Twisting Nether", slug: "twisting-nether" },
    { name: "Tyrande", slug: "tyrande" },
    { name: "Uldaman", slug: "uldaman" },
    { name: "Ulduar", slug: "ulduar" },
    { name: "Uldum", slug: "uldum" },
    { name: "Un'Goro", slug: "ungoro" },
    { name: "Varimathras", slug: "varimathras" },
    { name: "Vashj", slug: "vashj" },
    { name: "Vek'lor", slug: "veklor" },
    { name: "Vek'nilash", slug: "veknilash" },
    { name: "Vol'jin", slug: "voljin" },
    { name: "Wildhammer", slug: "wildhammer" },
    { name: "Wrathbringer", slug: "wrathbringer" },
    { name: "Xavius", slug: "xavius" },
    { name: "Ysera", slug: "ysera" },
    { name: "Ysondre", slug: "ysondre" },
    { name: "Zenedar", slug: "zenedar" },
    { name: "Zirkel des Cenarius", slug: "zirkel-des-cenarius" },
    { name: "Zul'jin", slug: "zuljin" },
    { name: "Zuluhed", slug: "zuluhed" },
  ],
  kr: [
    { name: "Alexstrasza", slug: "alexstrasza" },
    { name: "Azshara", slug: "azshara" },
    { name: "Burning Legion", slug: "burning-legion" },
    { name: "Cenarius", slug: "cenarius" },
    { name: "Dalaran", slug: "dalaran" },
    { name: "Deathwing", slug: "deathwing" },
    { name: "Durotan", slug: "durotan" },
    { name: "Garona", slug: "garona" },
    { name: "Gul'dan", slug: "guldan" },
    { name: "Hellscream", slug: "hellscream" },
    { name: "Hyjal", slug: "hyjal" },
    { name: "Malfurion", slug: "malfurion" },
    { name: "Norgannon", slug: "norgannon" },
    { name: "Ragnaros", slug: "ragnaros" },
    { name: "Rexxar", slug: "rexxar" },
    { name: "Stormrage", slug: "stormrage" },
    { name: "Wildhammer", slug: "wildhammer" },
    { name: "Windrunner", slug: "windrunner" },
    { name: "Zul'jin", slug: "zuljin" },
  ],
  tw: [
    { name: "Arthas", slug: "arthas" },
    { name: "Arygos", slug: "arygos" },
    { name: "Bleeding Hollow", slug: "bleeding-hollow" },
    { name: "Chillwind Point", slug: "chillwind-point" },
    { name: "Crystalpine Stinger", slug: "crystalpine-stinger" },
    { name: "Demon Fall Canyon", slug: "demon-fall-canyon" },
    { name: "Dragonmaw", slug: "dragonmaw" },
    { name: "Frostmane", slug: "frostmane" },
    { name: "Hellscream", slug: "hellscream" },
    { name: "Icecrown", slug: "icecrown" },
    { name: "Light's Hope", slug: "lights-hope" },
    { name: "Menethil", slug: "menethil" },
    { name: "Nightsong", slug: "nightsong" },
    { name: "Order of the Cloud Serpent", slug: "order-of-the-cloud-serpent" },
    { name: "Quel'dorei", slug: "queldorei" },
    { name: "Shadowmoon", slug: "shadowmoon" },
    { name: "Silverwing Hold", slug: "silverwing-hold" },
    { name: "Skywall", slug: "skywall" },
    { name: "Spirestone", slug: "spirestone" },
    { name: "Stormscale", slug: "stormscale" },
    { name: "Sundown Marsh", slug: "sundown-marsh" },
    { name: "Whisperwind", slug: "whisperwind" },
    { name: "World Tree", slug: "world-tree" },
    { name: "Wrathbringer", slug: "wrathbringer" },
    { name: "Zealot Blade", slug: "zealot-blade" },
  ],
};

interface CharacterLinkProps {
  sessionToken: string;
}

export function CharacterLink({ sessionToken }: CharacterLinkProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [region, setRegion] = useState<"us" | "eu" | "kr" | "tw">("us");
  const [realmSearch, setRealmSearch] = useState("");
  const [selectedRealm, setSelectedRealm] = useState<{ name: string; slug: string } | null>(null);
  const [showRealmDropdown, setShowRealmDropdown] = useState(false);
  const [characterName, setCharacterName] = useState("");

  // Query linked character
  const linkedData = useQuery(api.users.getLinkedCharacter, { sessionToken });

  // Actions
  const linkCharacter = useAction(api.users.linkCharacter);
  const refreshAchievements = useAction(api.users.refreshCharacterAchievements);
  const unlinkCharacter = useAction(api.users.unlinkCharacter);

  // Filter realms based on search
  const filteredRealms = useMemo(() => {
    const realms = REALMS[region];
    if (!realmSearch.trim()) return realms.slice(0, 10); // Show first 10 by default
    const search = realmSearch.toLowerCase();
    return realms.filter(r => r.name.toLowerCase().includes(search)).slice(0, 10);
  }, [region, realmSearch]);

  const handleRegionChange = (newRegion: "us" | "eu" | "kr" | "tw") => {
    setRegion(newRegion);
    setSelectedRealm(null);
    setRealmSearch("");
  };

  const handleRealmSelect = (realm: { name: string; slug: string }) => {
    setSelectedRealm(realm);
    setRealmSearch(realm.name);
    setShowRealmDropdown(false);
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRealm || !characterName.trim()) {
      setError("Please select a realm and enter your character name");
      return;
    }

    setIsLinking(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await linkCharacter({
        sessionToken,
        region,
        realmSlug: selectedRealm.slug,
        characterName: characterName.trim(),
      });

      if (result.success) {
        setSuccess(`Linked ${result.character?.name} - ${result.character?.realm} with ${result.achievementCount} achievements!`);
        setSelectedRealm(null);
        setRealmSearch("");
        setCharacterName("");
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || "Failed to link character");
      }
    } catch (err: any) {
      setError(err.message || "Failed to link character");
    } finally {
      setIsLinking(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await refreshAchievements({ sessionToken });

      if (result.success) {
        setSuccess(`Refreshed! ${result.achievementCount} achievements synced.`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to refresh");
      }
    } catch (err: any) {
      setError(err.message || "Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to unlink this character?")) return;

    setIsUnlinking(true);
    setError(null);

    try {
      const result = await unlinkCharacter({ sessionToken });
      if (!result.success) {
        setError(result.error || "Failed to unlink");
      }
    } catch (err: any) {
      setError(err.message || "Failed to unlink");
    } finally {
      setIsUnlinking(false);
    }
  };

  const linkedCharacter = linkedData?.linkedCharacter;
  const completedAchievements = linkedData?.completedAchievements || [];

  // Check if data is stale (> 1 hour old)
  const isStale = linkedCharacter && (Date.now() - linkedCharacter.lastSyncedAt > 60 * 60 * 1000);

  return (
    <div className="card" style={{ padding: "var(--space-lg)" }}>
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-md)",
          fontSize: "1.125rem",
        }}
      >
        <Gamepad2 size={20} style={{ color: "var(--accent)" }} />
        WoW Character
      </h3>

      <p className="text-muted" style={{ marginBottom: "var(--space-lg)", fontSize: "0.875rem" }}>
        Link your WoW character to see which achievements you&apos;ve completed when viewing housing designs.
      </p>

      {/* Error/Success Messages */}
      {error && (
        <div
          style={{
            padding: "var(--space-sm) var(--space-md)",
            marginBottom: "var(--space-md)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            color: "#ef4444",
            fontSize: "0.875rem",
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "var(--space-sm) var(--space-md)",
            marginBottom: "var(--space-md)",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "var(--radius)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            color: "#22c55e",
            fontSize: "0.875rem",
          }}
        >
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {linkedCharacter ? (
        /* Linked Character Display */
        <div>
          <div
            style={{
              padding: "var(--space-md)",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius)",
              marginBottom: "var(--space-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "1.125rem", marginBottom: "4px" }}>
                  {linkedCharacter.characterName}
                </div>
                <div className="text-muted" style={{ fontSize: "0.875rem", marginBottom: "var(--space-sm)" }}>
                  {linkedCharacter.realmName} ({linkedCharacter.region.toUpperCase()})
                  {linkedCharacter.characterLevel && ` • Level ${linkedCharacter.characterLevel}`}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  <Trophy size={14} style={{ color: "rgb(255, 128, 0)" }} />
                  <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    {completedAchievements.length.toLocaleString()} achievements
                  </span>
                </div>
              </div>
              <a
                href={`https://worldofwarcraft.blizzard.com/character/${linkedCharacter.region}/${linkedCharacter.realmSlug}/${linkedCharacter.characterName.toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ padding: "4px 8px" }}
              >
                <ExternalLink size={14} />
              </a>
            </div>

            <div
              className="text-muted"
              style={{
                fontSize: "0.75rem",
                marginTop: "var(--space-sm)",
                paddingTop: "var(--space-sm)",
                borderTop: "1px solid var(--border)",
              }}
            >
              Last synced: {new Date(linkedCharacter.lastSyncedAt).toLocaleString()}
              {isStale && <span style={{ color: "rgb(255, 209, 0)", marginLeft: "var(--space-sm)" }}>(stale)</span>}
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{ flex: 1 }}
            >
              {isRefreshing ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Refresh Achievements
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleUnlink}
              disabled={isUnlinking}
              style={{ color: "#ef4444" }}
            >
              {isUnlinking ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Unlink size={14} />
              )}
              Unlink
            </button>
          </div>
        </div>
      ) : (
        /* Link Character Form */
        <form onSubmit={handleLink}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "var(--space-xs)",
                }}
              >
                Region
              </label>
              <select
                value={region}
                onChange={(e) => handleRegionChange(e.target.value as "us" | "eu" | "kr" | "tw")}
                className="input"
                style={{ width: "100%" }}
              >
                <option value="us">US / Americas</option>
                <option value="eu">Europe</option>
                <option value="kr">Korea</option>
                <option value="tw">Taiwan</option>
              </select>
            </div>

            <div style={{ position: "relative" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "var(--space-xs)",
                }}
              >
                Realm
              </label>
              <div style={{ position: "relative" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  value={realmSearch}
                  onChange={(e) => {
                    setRealmSearch(e.target.value);
                    setSelectedRealm(null);
                    setShowRealmDropdown(true);
                  }}
                  onFocus={() => setShowRealmDropdown(true)}
                  onBlur={() => setTimeout(() => setShowRealmDropdown(false), 150)}
                  placeholder="Search for your realm..."
                  className="input"
                  style={{ width: "100%", paddingLeft: "36px" }}
                />
              </div>

              {/* Realm dropdown */}
              {showRealmDropdown && filteredRealms.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 10,
                  }}
                >
                  {filteredRealms.map((realm) => (
                    <button
                      key={realm.slug}
                      type="button"
                      onClick={() => handleRealmSelect(realm)}
                      style={{
                        width: "100%",
                        padding: "var(--space-sm) var(--space-md)",
                        background: selectedRealm?.slug === realm.slug ? "var(--surface-hover)" : "transparent",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = selectedRealm?.slug === realm.slug ? "var(--surface-hover)" : "transparent"}
                    >
                      {realm.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedRealm && (
                <p style={{ fontSize: "0.75rem", marginTop: "4px", color: "#22c55e" }}>
                  Selected: {selectedRealm.name}
                </p>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "var(--space-xs)",
                }}
              >
                Character Name
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Your character name"
                className="input"
                style={{ width: "100%" }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLinking || !selectedRealm}
              style={{ width: "100%" }}
            >
              {isLinking ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Gamepad2 size={16} />
                  Link Character
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
