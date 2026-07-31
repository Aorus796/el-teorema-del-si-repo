$ErrorActionPreference = "Stop"

try {
    $stdin = [Console]::In.ReadToEnd()
    $payload = $stdin | ConvertFrom-Json
    $path = [string]$payload.tool_input.file_path
}
catch {
    exit 0
}

if ([string]::IsNullOrWhiteSpace($path)) {
    exit 0
}

$normalized = $path -replace '\\', '/'

$isSecret = $false
if ($normalized -match '(^|/)private/') { $isSecret = $true }
if ($normalized -match '(^|/)combination\.txt$') { $isSecret = $true }
if ($normalized -match '(^|/)\.env(\..+)?$') { $isSecret = $true }

if ($isSecret) {
    $out = @{
        hookSpecificOutput = @{
            hookEventName            = "PreToolUse"
            permissionDecision       = "deny"
            permissionDecisionReason = "Edicion de secretos o recursos privados bloqueada (CLAUDE.md > Acciones prohibidas): $path"
        }
    }
    $out | ConvertTo-Json -Compress -Depth 5
}

exit 0
