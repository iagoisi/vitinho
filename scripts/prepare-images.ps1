Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$source = Join-Path $PSScriptRoot '../src/assets/images'
$target = Join-Path $PSScriptRoot '../public/media'
New-Item -ItemType Directory -Force -Path $target | Out-Null
$photos = @{
  hero = '400A2664.jpg.jpeg'
  guide = '400A8954.jpg.jpeg'
  macaw = 'Arara-azul.jpg.jpeg'
  jaguar = 'Jaguar 9.png'
  rapazinho = 'rapazinho - do - chaco 1.JPG.jpeg'
  anteater = (Get-ChildItem $source -Filter 'Tamandu*' -File | Select-Object -First 1 -ExpandProperty Name)
  tiriba = 'Tiriba-fogo.jpg.jpeg'
  sunset = 'VITINHO.jpeg'
  portrait = 'WhatsApp Image 2026-10-09 at 08.41.00.jpeg'
  woodpecker = 'WhatsApp Image 2026-10-09 at 08.44.02.jpeg'
  teamVitinho = '400A9014.jpg'
  birders = '400A2598.jpg'
  boat = '400A2798.jpg'
  aracari = (Get-ChildItem $source -Filter 'Ara*castanho.jpg' -File | Select-Object -First 1 -ExpandProperty Name)
  redMacaw = 'Arara-vermelha.jpg'
  birding = '400A2891.jpg'
  wildlife = '400A9047-Aprimorado-NR.jpg'
  private = '400A2627.jpg'
}
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$quality = [System.Drawing.Imaging.EncoderParameters]::new(1)
$quality.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, 84L)

foreach ($name in $photos.Keys) {
  $original = [System.Drawing.Image]::FromFile((Join-Path $source $photos[$name]))
  try {
    foreach ($size in @(800, $(if ($name -eq 'hero') { 2400 } else { 1800 }))) {
      $width = [Math]::Min($size, $original.Width)
      $height = [int][Math]::Round($original.Height * $width / $original.Width)
      $bitmap = [System.Drawing.Bitmap]::new($width, $height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($original, 0, 0, $width, $height)
        $path = Join-Path $target "$name-$size.jpg"
        $bitmap.Save($path, $codec, $quality)
        if ((Get-Item $path).Length -eq 0) { throw "Empty image: $path" }
      } finally { $graphics.Dispose(); $bitmap.Dispose() }
    }
  } finally { $original.Dispose() }
}
$quality.Dispose()
