
$path = 'c:\Users\vidal\OneDrive\Anti-Gravity\Centinela 2.0 - copia (2)\src\pages\CompanyDashboard.jsx'
$lines = Get-Content -Path $path
$skipCount = 0
$output = New-Object System.Collections.Generic.List[string]

foreach ($line in $lines) {
    if ($skipCount -gt 0) {
        $skipCount--
        continue
    }

    if ($line -match '\)\}         </table>') {
        $output.Add('         )}')
        $skipCount = 5 # skip the next 5 lines of leftover table closing
    } elseif ($line -match 'setShowTrashModal\(false\)') {
        $output.Add('               <div style={{ display: ''grid'', gridTemplateColumns: ''auto 1fr'', gap: ''15px'' }}>')
        $output.Add('                 <button onClick={handleEmptyTrash} disabled={trashItems.length === 0} style={{ padding: ''15px'', borderRadius: ''12px'', background: ''rgba(239, 68, 68, 0.1)'', color: ''#ef4444'', border: ''1px solid rgba(239, 68, 68, 0.2)'', cursor: ''pointer'', fontWeight: ''bold'' }}>VACIAR PAPELERA</button>')
        $output.Add('                 <button onClick={() => setShowTrashModal(false)} className=''primary'' style={{ padding: ''15px'', borderRadius: ''12px'' }}>CERRAR PANEL</button>')
        $output.Add('               </div>')
    } else {
        $output.Add($line)
    }
}

$output | Set-Content -Path $path -Encoding UTF8
