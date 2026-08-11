$ErrorActionPreference = "Stop"

function Deny([string]$Reason) {
    $out = @{
        hookSpecificOutput = @{
            hookEventName            = "PreToolUse"
            permissionDecision       = "deny"
            permissionDecisionReason = $Reason
        }
    }
    $out | ConvertTo-Json -Compress -Depth 5
    exit 0
}

try {
    $stdin = [Console]::In.ReadToEnd()
    $payload = $stdin | ConvertFrom-Json
    $cmd = [string]$payload.tool_input.command
}
catch {
    exit 0
}

if ([string]::IsNullOrWhiteSpace($cmd)) {
    exit 0
}

if (($cmd -match 'git\s+push\b') -and ($cmd -match '(?:^|\s)(--force|-f)(?:\s|$)')) {
    Deny "Force push bloqueado (CLAUDE.md > Acciones prohibidas). No uses --force/-f al hacer push."
}

if (($cmd -match 'git\s+reset\b') -and ($cmd -match '--hard\b')) {
    Deny "git reset --hard bloqueado (CLAUDE.md > Acciones prohibidas): es destructivo e irreversible."
}

if (($cmd -match 'git\s+clean\b') -and ($cmd -match '(?:^|\s)-f\w*(?:\s|$)')) {
    Deny "git clean -f bloqueado (CLAUDE.md > Acciones prohibidas): elimina archivos sin posibilidad de recuperarlos."
}

if (($cmd -match 'git\s+branch\b') -and ($cmd -match '(?:^|\s)-D(?:\s|$)|--delete\s+--force')) {
    Deny "Borrado forzado de rama bloqueado (CLAUDE.md > Acciones prohibidas)."
}

if ($cmd -match 'npm\s+(install|i|add)\b(.*)') {
    $rest = $Matches[2]
    $tokens = @($rest -split '\s+' | Where-Object { $_ -ne '' })
    $hasPackageArg = $false
    foreach ($t in $tokens) {
        if ($t -notmatch '^-') {
            $hasPackageArg = $true
        }
    }
    if ($hasPackageArg) {
        Deny "Instalar dependencias nuevas requiere aprobacion humana explicita (AGENTS.md / CLAUDE.md). 'npm ci' y 'npm install' sin paquetes siguen permitidos."
    }
}

if ($cmd -match 'git\s+(commit|push)\b') {
    try {
        $branch = (git rev-parse --abbrev-ref HEAD 2>$null)
        if ($branch) { $branch = $branch.Trim() }
    }
    catch {
        $branch = ""
    }
    if ($branch -eq "main") {
        Deny "Commit/push directo sobre 'main' esta bloqueado (CLAUDE.md > Gestion de Git). Trabaja en una rama de tarea."
    }
}

exit 0
