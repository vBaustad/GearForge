New-Item -ItemType Directory -Force -Path "public/images/progression" | Out-Null

$base = "https://wow.zamimg.com/images/wow/icons/large"
$map = @{
  "trade_enchanting_smalletherealshard" = "catalyst.jpg"     # Catalyst
  "inv_spark_whole_green"               = "spark-whole.jpg"  # Full spark
  "inv_spark_shard_green"               = "spark-half.jpg"   # Half spark (for later if needed)
}

foreach ($k in $map.Keys) {
  $src  = "$base/$($k.ToLower()).jpg"
  $dest = Join-Path "public/images/progression" $map[$k]
  Invoke-WebRequest -UseBasicParsing -Uri $src -OutFile $dest
  Write-Host "Saved $dest"
}
