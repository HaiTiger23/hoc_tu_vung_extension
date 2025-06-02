# Create fonts directory if it doesn't exist
$fontsDir = "d:\tool\EL_extension\stats\vendor\fonts"
if (!(Test-Path -Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir | Out-Null
}

# Download Bootstrap Icons font files
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/fonts/bootstrap-icons.woff2" -OutFile "$fontsDir\bootstrap-icons.woff2"
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/fonts/bootstrap-icons.woff" -OutFile "$fontsDir\bootstrap-icons.woff"

Write-Host "Font files downloaded successfully to $fontsDir"
