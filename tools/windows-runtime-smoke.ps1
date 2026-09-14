<#
.SYNOPSIS
    Smoke test de runtime para un ejecutable Windows empaquetado: comprueba
    si el proceso real permanece vivo al menos -SurvivalSeconds segundos.

.DESCRIPTION
    Lanza -LauncherPath (puede ser el .exe real desempaquetado o un stub
    autoextraible, como el portable NSIS generado por electron-builder),
    sondea por nombre de proceso (-RealProcessName) hasta que aparece, y
    despues sondea ese mismo objeto de proceso hasta que hayan pasado
    -SurvivalSeconds segundos desde su aparicion o hasta que termine antes.

    Este script no intenta "arreglar" ningun cierre: solo lo clasifica
    (PASS/FAIL) y, si falla, recoge diagnostico best-effort (eventos de
    aplicacion, Windows Error Reporting, Microsoft Defender, archivos
    recientes en %TEMP%) para comparar un runner limpio de GitHub Actions
    frente a un cierre reproducible observado en una maquina corporativa
    local.

    Reutilizable: no contiene ninguna ruta ni nombre de artefacto
    hardcodeado. Cada llamador (el step "Win-unpacked runtime smoke test" y
    el step "Portable runtime smoke test" en
    .github/workflows/windows-portable.yml) pasa su propio -LauncherPath.

    Siempre termina con exit code 0, independientemente del veredicto: el
    unico step del workflow con permiso para fallar el job es el step de
    clasificacion final, que lee los outputs de este script.

.PARAMETER LauncherPath
    Ruta del .exe a lanzar con Start-Process. Puede ser el proceso real o
    un stub que a su vez lanza el proceso real (por ejemplo el portable
    NSIS autoextraible).

.PARAMETER RealProcessName
    Nombre de proceso (sin extension .exe) a sondear para confirmar que la
    aplicacion real arranco, independientemente de si -LauncherPath es ese
    mismo proceso o un stub que lo lanza.

.PARAMETER SurvivalSeconds
    Segundos que el proceso real debe seguir vivo, contados desde que
    aparece, para considerarse un PASS.

.PARAMETER AppearanceTimeoutSeconds
    Segundos maximos a esperar a que -RealProcessName aparezca antes de
    declarar FAIL por NEVER_APPEARED.

.PARAMETER PollIntervalMilliseconds
    Intervalo de sondeo, tanto para la aparicion del proceso como para su
    supervivencia.

.PARAMETER OutputPrefix
    Prefijo (por ejemplo "WIN_UNPACKED" o "PORTABLE") usado para nombrar
    las claves escritas en $env:GITHUB_OUTPUT, de forma que dos llamadas a
    este script en el mismo job no colisionen entre si.
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$LauncherPath,

    [Parameter(Mandatory = $true)]
    [string]$RealProcessName,

    [int]$SurvivalSeconds = 10,

    [int]$AppearanceTimeoutSeconds = 30,

    [int]$PollIntervalMilliseconds = 250,

    [Parameter(Mandatory = $true)]
    [string]$OutputPrefix
)

$ErrorActionPreference = "Stop"

# Resultado por defecto: se va rellenando a medida que avanza el sondeo.
$result = @{
    Runtime               = "FAIL"
    NeverAppeared         = $true
    TimeToAppearSeconds   = ""
    AliveSeconds          = ""
    ExitCode              = ""
}

function Write-DiagnosticSection {
    param(
        [string]$Title,
        [scriptblock]$Body
    )

    Write-Output ""
    Write-Output "=== $Title ==="
    try {
        & $Body
    }
    catch {
        Write-Output "(fallo al recoger este diagnostico: $($_.Exception.Message))"
    }
}

function Collect-FailureDiagnostics {
    param(
        [string]$RealProcessName,
        [string]$LauncherPath,
        [datetime]$LaunchTime
    )

    $launcherBaseName = [System.IO.Path]::GetFileNameWithoutExtension($LauncherPath)
    $processNames = @($RealProcessName, $launcherBaseName) | Select-Object -Unique

    Write-DiagnosticSection -Title "Get-Process (procesos vivos con nombre coincidente)" -Body {
        Get-Process -Name $processNames -ErrorAction SilentlyContinue |
            Format-Table Id, ProcessName, StartTime, HasExited -AutoSize |
            Out-String
    }

    Write-DiagnosticSection -Title "Win32_Process (linea de comandos completa)" -Body {
        $filter = ($processNames | ForEach-Object { "Name='$_.exe'" }) -join " OR "
        Get-CimInstance -ClassName Win32_Process -Filter $filter -ErrorAction SilentlyContinue |
            Format-Table ProcessId, Name, CommandLine -AutoSize |
            Out-String
    }

    Write-DiagnosticSection -Title "Application event log desde el lanzamiento" -Body {
        try {
            Get-WinEvent -FilterHashtable @{ LogName = "Application"; StartTime = $LaunchTime } -ErrorAction Stop |
                Select-Object TimeCreated, ProviderName, Id, LevelDisplayName, Message |
                Format-List |
                Out-String
        }
        catch {
            "(sin eventos de Application en la ventana de tiempo, o log no disponible: $($_.Exception.Message))"
        }
    }

    Write-DiagnosticSection -Title "Windows Error Reporting" -Body {
        $crashDumpsPath = Join-Path $env:LOCALAPPDATA "CrashDumps"
        if (Test-Path $crashDumpsPath) {
            Write-Output "Contenido de $crashDumpsPath :"
            Get-ChildItem -Path $crashDumpsPath -ErrorAction SilentlyContinue |
                Format-Table Name, Length, LastWriteTime -AutoSize |
                Out-String
        }
        else {
            Write-Output "$crashDumpsPath no existe."
        }

        try {
            Get-WinEvent -FilterHashtable @{ LogName = "Application"; ProviderName = "Windows Error Reporting"; StartTime = $LaunchTime } -ErrorAction Stop |
                Select-Object TimeCreated, Id, Message |
                Format-List |
                Out-String
        }
        catch {
            "(sin eventos de Windows Error Reporting en la ventana de tiempo: $($_.Exception.Message))"
        }
    }

    Write-DiagnosticSection -Title "Microsoft Defender" -Body {
        if (Get-Command Get-MpComputerStatus -ErrorAction SilentlyContinue) {
            try {
                Get-MpComputerStatus -ErrorAction Stop |
                    Format-List AntivirusEnabled, RealTimeProtectionEnabled, AntivirusSignatureLastUpdated |
                    Out-String
            }
            catch {
                "(fallo al consultar Get-MpComputerStatus: $($_.Exception.Message))"
            }
        }
        else {
            "Get-MpComputerStatus no esta disponible en este runner."
        }

        try {
            Get-WinEvent -FilterHashtable @{ LogName = "Microsoft-Windows-Windows Defender/Operational"; StartTime = $LaunchTime } -ErrorAction Stop |
                Select-Object TimeCreated, Id, Message |
                Format-List |
                Out-String
        }
        catch {
            "(sin eventos de Windows Defender en la ventana de tiempo, o log no disponible: $($_.Exception.Message))"
        }
    }

    Write-DiagnosticSection -Title "Archivos recientes en `$env:TEMP" -Body {
        Get-ChildItem -Path $env:TEMP -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -gt $LaunchTime } |
            Format-Table Name, Length, LastWriteTime -AutoSize |
            Out-String
    }
}

function Write-Summary {
    param(
        [string]$OutputPrefix,
        [hashtable]$Result
    )

    if (-not $env:GITHUB_STEP_SUMMARY) {
        return
    }

    $lines = @(
        "### Runtime smoke test: $OutputPrefix",
        "",
        "- Resultado: $($Result.Runtime)",
        "- Nunca aparecio: $($Result.NeverAppeared)",
        "- Tiempo hasta aparecer (s): $($Result.TimeToAppearSeconds)",
        "- Tiempo vivo (s): $($Result.AliveSeconds)",
        "- Exit code: $($Result.ExitCode)",
        ""
    )

    Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value ($lines -join "`n")
}

function Write-ScriptOutputs {
    param(
        [string]$OutputPrefix,
        [hashtable]$Result
    )

    $pairs = @(
        "${OutputPrefix}_RUNTIME=$($Result.Runtime)",
        "${OutputPrefix}_NEVER_APPEARED=$($Result.NeverAppeared.ToString().ToLowerInvariant())",
        "${OutputPrefix}_TIME_TO_APPEAR_SECONDS=$($Result.TimeToAppearSeconds)",
        "${OutputPrefix}_ALIVE_SECONDS=$($Result.AliveSeconds)",
        "${OutputPrefix}_EXIT_CODE=$($Result.ExitCode)"
    )

    foreach ($pair in $pairs) {
        Write-Output $pair
        if ($env:GITHUB_OUTPUT) {
            Add-Content -Path $env:GITHUB_OUTPUT -Value $pair
        }
    }
}

# --- 1. El launcher debe existir como archivo ---

if (-not (Test-Path -Path $LauncherPath -PathType Leaf)) {
    Write-Output "FAIL: LauncherPath '$LauncherPath' no existe. No se intenta lanzar nada."
    Write-Summary -OutputPrefix $OutputPrefix -Result $result
    Write-ScriptOutputs -OutputPrefix $OutputPrefix -Result $result
    exit 0
}

# --- 2. Lanzar el proceso ---

$launchTime = Get-Date
$launcherProcess = $null
try {
    $launcherProcess = Start-Process -FilePath $LauncherPath -PassThru -ErrorAction Stop
}
catch {
    Write-Output "FAIL: Start-Process fallo para '$LauncherPath': $($_.Exception.Message)"
    Collect-FailureDiagnostics -RealProcessName $RealProcessName -LauncherPath $LauncherPath -LaunchTime $launchTime
    Write-Summary -OutputPrefix $OutputPrefix -Result $result
    Write-ScriptOutputs -OutputPrefix $OutputPrefix -Result $result
    exit 0
}

# --- 3. Sondear la aparicion del proceso real ---

$realProcess = $null
$appearanceDeadline = $launchTime.AddSeconds($AppearanceTimeoutSeconds)

while ((Get-Date) -lt $appearanceDeadline) {
    $candidates = Get-Process -Name $RealProcessName -ErrorAction SilentlyContinue |
        Where-Object { $_.StartTime -ge $launchTime } |
        Sort-Object StartTime -Descending

    if ($candidates) {
        $realProcess = $candidates[0]
        break
    }

    Start-Sleep -Milliseconds $PollIntervalMilliseconds
}

if (-not $realProcess) {
    Write-Output "FAIL: '$RealProcessName' nunca aparecio dentro de $AppearanceTimeoutSeconds s."
    $result.Runtime = "FAIL"
    $result.NeverAppeared = $true
    Collect-FailureDiagnostics -RealProcessName $RealProcessName -LauncherPath $LauncherPath -LaunchTime $launchTime

    # Cierre defensivo del proceso lanzado, por si sigue vivo aunque el
    # proceso real esperado nunca haya aparecido.
    if ($launcherProcess) {
        try {
            if (-not $launcherProcess.HasExited) {
                Stop-Process -Id $launcherProcess.Id -Force -ErrorAction SilentlyContinue
            }
        }
        catch {
            # El launcher puede no ser accesible (handle invalido,
            # interferencia externa); no es un error para este script.
        }
    }

    Write-Summary -OutputPrefix $OutputPrefix -Result $result
    Write-ScriptOutputs -OutputPrefix $OutputPrefix -Result $result
    exit 0
}

$appearedAt = Get-Date
$result.NeverAppeared = $false
$result.TimeToAppearSeconds = [math]::Round(($appearedAt - $launchTime).TotalSeconds, 2)

Write-Output "'$RealProcessName' aparecio (PID $($realProcess.Id)) tras $($result.TimeToAppearSeconds) s."

# --- 4. Sondear supervivencia del proceso real ---

$survivalDeadline = $appearedAt.AddSeconds($SurvivalSeconds)
$died = $false
$survivalProbeFailed = $false

try {
    while ((Get-Date) -lt $survivalDeadline) {
        $realProcess.Refresh()
        if ($realProcess.HasExited) {
            $died = $true
            break
        }
        Start-Sleep -Milliseconds $PollIntervalMilliseconds
    }

    if (-not $died) {
        $realProcess.Refresh()
        $died = $realProcess.HasExited
    }
}
catch {
    # El proceso real puede dejar de ser accesible durante el sondeo (por
    # ejemplo por interferencia de un AV/EDR sobre el handle) en lugar de
    # terminar limpiamente. Se trata como una muerte para efectos del
    # veredicto, pero se distingue en el log.
    $died = $true
    $survivalProbeFailed = $true
    Write-Output "(fallo al sondear '$RealProcessName' durante la ventana de supervivencia: $($_.Exception.Message))"
}

if ($died) {
    $aliveSeconds = [math]::Round(((Get-Date) - $appearedAt).TotalSeconds, 2)
    if ($survivalProbeFailed) {
        Write-Output "FAIL: no se pudo seguir sondeando '$RealProcessName' tras $aliveSeconds s (excepcion al consultar el proceso; posible interferencia externa)."
    }
    else {
        Write-Output "FAIL: '$RealProcessName' murio tras $aliveSeconds s (antes de los $SurvivalSeconds s requeridos)."
    }

    $result.Runtime = "FAIL"
    $result.AliveSeconds = $aliveSeconds

    try {
        $result.ExitCode = $realProcess.ExitCode
    }
    catch {
        Write-Output "(no se pudo leer ExitCode: $($_.Exception.Message))"
    }

    Collect-FailureDiagnostics -RealProcessName $RealProcessName -LauncherPath $LauncherPath -LaunchTime $launchTime
}
else {
    Write-Output "PASS: '$RealProcessName' sigue vivo tras $SurvivalSeconds s."
    $result.Runtime = "PASS"
    $result.AliveSeconds = $SurvivalSeconds
}

# --- 6. Cierre explicito, siempre, tanto en PASS como en FAIL ---

try {
    $realProcess.Refresh()
    if (-not $realProcess.HasExited) {
        Stop-Process -Id $realProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
catch {
    # El proceso puede haber desaparecido entre el Refresh y el Stop-Process;
    # no es un error para este script.
}

if ($launcherProcess -and $launcherProcess.Id -ne $realProcess.Id) {
    try {
        $launcherProcess.Refresh()
        if (-not $launcherProcess.HasExited) {
            Stop-Process -Id $launcherProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        # Igual que arriba: el stub puede haber terminado por su cuenta.
    }
}

# --- 7 y 8. Reportar resultado y salir siempre con codigo 0 ---

Write-Summary -OutputPrefix $OutputPrefix -Result $result
Write-ScriptOutputs -OutputPrefix $OutputPrefix -Result $result

exit 0
