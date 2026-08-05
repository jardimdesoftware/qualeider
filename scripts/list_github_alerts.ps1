param(
  [Parameter(Mandatory=$true)] [string]$Owner,
  [Parameter(Mandatory=$true)] [string]$Repo
)

Write-Output "Listando Dependabot alerts para $Owner/$Repo"
gh api -H 'Accept: application/vnd.github+json' "/repos/$Owner/$Repo/dependabot/alerts" | Out-File -FilePath dependabot-alerts.json -Encoding utf8
Write-Output "Dependabot alerts salvos em dependabot-alerts.json"

Write-Output "Listando Code Scanning alerts para $Owner/$Repo"
gh api -H 'Accept: application/vnd.github+json' "/repos/$Owner/$Repo/code-scanning/alerts" | Out-File -FilePath code-scanning-alerts.json -Encoding utf8
Write-Output "Code Scanning alerts salvos em code-scanning-alerts.json"

Write-Output "Relatórios gerados."
