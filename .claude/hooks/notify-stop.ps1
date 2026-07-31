$ErrorActionPreference = "SilentlyContinue"

$message = "Claude ha terminado el turno en el-teorema-del-si-repo. Revisa si hay un bloqueo real que requiera intervencion humana (ver CLAUDE.md > Casos que requieren aprobacion humana)."

$out = @{ systemMessage = $message }
$out | ConvertTo-Json -Compress
exit 0
