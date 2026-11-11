param(
    [Parameter(Mandatory = $true)]
    [switch]$ConfirmProduction,

    [string]$QualeiderUrl = 'https://alexandrejota.me',
    [string]$EduTraceUrl = 'https://edutrace.ruancarvalho.me',
    [string]$EduTracePath = (Join-Path $PSScriptRoot '..\..\edutrace')
)

$ErrorActionPreference = 'Stop'

if (-not $ConfirmProduction) {
    throw 'Use -ConfirmProduction para confirmar a janela de carga controlada.'
}

function Assert-Available {
    param([string]$Name, [string]$Url)

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Head -MaximumRedirection 5 -TimeoutSec 15
        if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
            throw "HTTP $($response.StatusCode)"
        }
    } catch {
        throw "$Name não está disponível em $Url. O teste de carga não será iniciado. $($_.Exception.Message)"
    }
}

function Invoke-K6 {
    param(
        [string]$Name,
        [string]$Repository,
        [string]$Script,
        [string]$BaseUrl
    )

    $mount = "${Repository}:/work"
    & docker run --rm -v $mount -w /work `
        -e "BASE_URL=$BaseUrl" `
        grafana/k6:1.8.2 run $Script

    if ($LASTEXITCODE -ne 0) {
        throw "O teste k6 de $Name falhou com código $LASTEXITCODE."
    }
}

$qualeiderRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$edutraceRoot = (Resolve-Path $EduTracePath).Path

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker não foi encontrado.'
}

& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw 'O Docker Desktop/daemon não está em execução.'
}

Assert-Available -Name 'Qualeider' -Url $QualeiderUrl
Assert-Available -Name 'EduTrace' -Url $EduTraceUrl

Invoke-K6 -Name 'Qualeider' -Repository $qualeiderRoot -Script 'k6/load.js' -BaseUrl $QualeiderUrl
Invoke-K6 -Name 'EduTrace' -Repository $edutraceRoot -Script 'k6/tests/load/production-public.test.js' -BaseUrl $EduTraceUrl

Write-Host 'Testes concluídos. Evidências:'
Write-Host (Join-Path $qualeiderRoot 'evidencias\k6-qualeider-summary.json')
Write-Host (Join-Path $edutraceRoot 'evidencias\k6-edutrace-summary.json')
