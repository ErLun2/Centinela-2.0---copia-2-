$path = "c:\Users\vidal\OneDrive\Anti-Gravity\Centinela 2.0 - copia (2)\src\pages\CompanyDashboard.jsx"
$content = Get-Content $path -Raw
# Regex search that avoids emojis
$content = $content -replace 'alert\("..  Ubicación encontrada.*"\);', 'showToast("Ubicación encontrada.");'
$content = $content -replace 'alert\("Ãƒ¢Ã‚ Ã….*No se pudo encontrar la dirección.*"\);', 'showToast("No se pudo encontrar la dirección.", "error");'
$content = $content -replace 'alert\("Ãƒ¢Ã…¡.*Error al conectar con el servicio de mapas.*"\);', 'showToast("Error de conexión.", "error");'
[System.IO.File]::WriteAllText($path, $content)
