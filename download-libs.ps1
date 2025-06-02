# Create vendor directory if it doesn't exist
$vendorDir = "d:\tool\EL_extension\stats\vendor"
if (!(Test-Path -Path $vendorDir)) {
    New-Item -ItemType Directory -Path $vendorDir | Out-Null
}

# Download Bootstrap CSS
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" -OutFile "$vendorDir\bootstrap.min.css"

# Download Bootstrap Icons
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" -OutFile "$vendorDir\bootstrap-icons.css"

# Download Chart.js
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" -OutFile "$vendorDir\chart.min.js"

# Download Bootstrap JS Bundle with Popper
Invoke-WebRequest -Uri "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" -OutFile "$vendorDir\bootstrap.bundle.min.js"

Write-Host "Libraries downloaded successfully to $vendorDir"
