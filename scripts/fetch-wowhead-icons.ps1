<#
.SYNOPSIS
  Downloads WoW class & spec icons from Wowhead/Zamimg.
  Examples:
    classes/Paladin.jpg
    specs/Evoker - Devastation.jpg
#>

[CmdletBinding()]
param(
  [string]$OutDir = "public/images/icons",
  [ValidateSet("tiny","small","medium","large")]
  [string]$Size = "large"
)

$ErrorActionPreference = "Stop"
$BASE = "https://wow.zamimg.com/images/wow/icons"

function Ensure-Dir([string]$Path) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
}

function SafeName([string]$s) {
  if (-not $s) { return "" }
  ($s -replace '[\\/:*?"<>|]', ' ').Trim()
}

function Save-Icon {
  param(
    [Parameter(Mandatory)] [string[]]$Slugs,  # try each slug
    [Parameter(Mandatory)] [string]$Size,
    [Parameter(Mandatory)] [string]$OutFile
  )
  $exts = @("jpg","png","gif")
  foreach ($slug in $Slugs) {
    foreach ($ext in $exts) {
      $url  = "$BASE/$Size/$slug.$ext"
      $dest = [IO.Path]::ChangeExtension($OutFile, ".$ext")  # match real extension
      try {
        Ensure-Dir $dest
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -ErrorAction Stop
        Write-Host "Saved $dest  ($Size/$slug.$ext)"
        return $true
      } catch { }
    }
  }
  Write-Warning "Failed to fetch: $($Slugs -join ', ') at size '$Size'"
  return $false
}

# All classes + their spec keys
$Classes = @(
  @{ key="warrior";      name="Warrior";      specs=@("arms","fury","protection") }
  @{ key="paladin";      name="Paladin";      specs=@("holy","protection","retribution") }
  @{ key="hunter";       name="Hunter";       specs=@("beastmastery","marksmanship","survival") }
  @{ key="rogue";        name="Rogue";        specs=@("assassination","outlaw","subtlety") }
  @{ key="priest";       name="Priest";       specs=@("discipline","holy","shadow") }
  @{ key="deathknight";  name="Death Knight"; specs=@("blood","frost","unholy") }
  @{ key="shaman";       name="Shaman";       specs=@("elemental","enhancement","restoration") }
  @{ key="mage";         name="Mage";         specs=@("arcane","fire","frost") }
  @{ key="warlock";      name="Warlock";      specs=@("affliction","demonology","destruction") }
  @{ key="monk";         name="Monk";         specs=@("brewmaster","mistweaver","windwalker") }
  @{ key="druid";        name="Druid";        specs=@("balance","feral","guardian","restoration") }
  @{ key="demonhunter";  name="Demon Hunter"; specs=@("havoc","vengeance") }
  @{ key="evoker";       name="Evoker";       specs=@("devastation","preservation","augmentation") }
)

# Proper display for filenames
$SpecDisplay = @{
  arms="Arms"; fury="Fury"; protection="Protection"; retribution="Retribution"; holy="Holy";
  beastmastery="Beast Mastery"; marksmanship="Marksmanship"; survival="Survival";
  assassination="Assassination"; outlaw="Outlaw"; subtlety="Subtlety";
  discipline="Discipline"; shadow="Shadow";
  blood="Blood"; frost="Frost"; unholy="Unholy";
  elemental="Elemental"; enhancement="Enhancement"; restoration="Restoration";
  arcane="Arcane"; fire="Fire";
  affliction="Affliction"; demonology="Demonology"; destruction="Destruction";
  brewmaster="Brewmaster"; mistweaver="Mistweaver"; windwalker="Windwalker";
  balance="Balance"; feral="Feral"; guardian="Guardian";
  havoc="Havoc"; vengeance="Vengeance";
  devastation="Devastation"; preservation="Preservation"; augmentation="Augmentation"
}

# Spec slug map (primary -> guaranteed-ish Wowhead/Zamimg slugs)
# Evoker works with classicon_*; others use iconic spell slugs.
$SpecSlugMap = @{
  # Warrior
  "warrior-arms"        = @("ability_warrior_savageblow")
  "warrior-fury"        = @("ability_warrior_innerrage")
  "warrior-protection"  = @("ability_warrior_defensivestance")

  # Paladin
  "paladin-holy"        = @("spell_holy_holybolt")
  "paladin-protection"  = @("ability_paladin_shieldofthetemplar")
  "paladin-retribution" = @("spell_holy_auraoflight")

  # Hunter
  "hunter-beastmastery" = @("ability_hunter_bestialdiscipline")
  "hunter-marksmanship" = @("ability_hunter_focusedaim")
  "hunter-survival"     = @("ability_hunter_camouflage")

  # Rogue
  "rogue-assassination" = @("ability_rogue_deadlybrew")
  "rogue-outlaw"        = @("ability_rogue_waylay")
  "rogue-subtlety"      = @("ability_stealth")

  # Priest
  "priest-discipline"   = @("spell_holy_powerwordshield")
  "priest-holy"         = @("spell_holy_guardianspirit")
  "priest-shadow"       = @("spell_shadow_shadowwordpain")

  # Death Knight
  "deathknight-blood"   = @("spell_deathknight_bloodpresence")
  "deathknight-frost"   = @("spell_deathknight_frostpresence")
  "deathknight-unholy"  = @("spell_deathknight_unholypresence")

  # Shaman
  "shaman-elemental"    = @("spell_nature_lightning")
  "shaman-enhancement"  = @("spell_shaman_improvedstormstrike")
  "shaman-restoration"  = @("spell_nature_magicimmunity")

  # Mage
  "mage-arcane"         = @("ability_mage_arcanebarrage")
  "mage-fire"           = @("spell_fire_firebolt")
  "mage-frost"          = @("spell_frost_frostbolt02")

  # Warlock
  "warlock-affliction"  = @("spell_shadow_deathcoil")
  "warlock-demonology"  = @("spell_shadow_metamorphosis")
  "warlock-destruction" = @("spell_fire_fireball02")

  # Monk (uses the *_spec slugs)
  "monk-brewmaster"     = @("spell_monk_brewmaster_spec")
  "monk-mistweaver"     = @("spell_monk_mistweaver_spec")
  "monk-windwalker"     = @("spell_monk_windwalker_spec")

  # Druid
  "druid-balance"       = @("spell_nature_starfall")
  "druid-feral"         = @("ability_druid_catform")
  "druid-guardian"      = @("ability_racial_bearform")
  "druid-restoration"   = @("spell_nature_healingtouch")

  # Demon Hunter
  "demonhunter-havoc"   = @("ability_demonhunter_specdps")
  "demonhunter-vengeance" = @("ability_demonhunter_spectank")

  # Evoker (classicon works nicely; include ability_* as fallback)
  "evoker-devastation"  = @("classicon_evoker_devastation","ability_evoker_devastation")
  "evoker-preservation" = @("classicon_evoker_preservation","ability_evoker_preservation")
  "evoker-augmentation" = @("classicon_evoker_augmentation","ability_evoker_augmentation")
}

# -------- Classes (full names) --------
foreach ($cls in $Classes) {
  $classKey  = $cls.key
  $className = $cls.name
  $out = Join-Path $OutDir ("classes/" + (SafeName $className) + ".jpg")
  $slugs = @("classicon-$classKey","classicon_$classKey")  # try both
  Save-Icon -Slugs $slugs -Size $Size -OutFile $out | Out-Null
}

# -------- Specs (Class - Spec filenames) --------
$missing = @()
foreach ($cls in $Classes) {
  $classKey  = $cls.key
  $className = $cls.name
  foreach ($specKey in $cls.specs) {
    $specName = $SpecDisplay[$specKey]
    if (-not $specName) { $specName = (Get-Culture).TextInfo.ToTitleCase($specKey) }
    $fileName = (SafeName "$className - $specName") + ".jpg"
    $out = Join-Path $OutDir ("specs/" + $fileName)

    # Try classicon_<class>_<spec> first (works for Evoker), then mapped spell slugs.
    $slugCandidates = @("classicon_${classKey}_${specKey}", "classicon-$classKey-$specKey")
    $key = "$classKey-$specKey"
    if ($SpecSlugMap.ContainsKey($key)) {
      $slugCandidates += $SpecSlugMap[$key]
    }

    if (-not (Save-Icon -Slugs $slugCandidates -Size $Size -OutFile $out)) {
      $missing += $key
    }
  }
}

if ($missing.Count -gt 0) {
  Write-Warning ("Missing icons for: " + ($missing -join ", "))
} else {
  Write-Host "All class & spec icons saved."
}
