$path = "c:\Users\vidal\OneDrive\Anti-Gravity\Centinela 2.0 - copia (2)\src\pages\MasterDashboard.jsx"
$content = Get-Content $path
$newContent = @()
for ($i=0; $i -lt $content.Length; $i++) {
    $lineNum = $i + 1
    # Check if this line is one of the orphaned garbage lines
    if ($lineNum -eq 1283 -or $lineNum -eq 1284 -or $lineNum -eq 1285) {
        continue
    }
    $newContent += $content[$i]
}
$newContent | Set-Content $path -Encoding utf8
