# Reads frontend/.env and writes js/config.js for the static site.
$ErrorActionPreference = 'Stop'

$frontendRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $frontendRoot '.env'
$outFile = Join-Path $frontendRoot 'js\config.js'

if (-not (Test-Path $envFile)) {
    Write-Error "Missing $envFile - copy .env.example to .env and fill in your Supabase credentials."
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith('#') -and $line -match '^([^=]+)=(.*)$') {
        $vars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$required = @('SUPABASE_URL', 'SUPABASE_ANON_KEY')
foreach ($key in $required) {
    if (-not $vars.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($vars[$key])) {
        Write-Error "Missing or empty $key in $envFile"
    }
}

$apiUrl = if ($vars.ContainsKey('API_URL') -and $vars['API_URL']) { $vars['API_URL'] } else { 'http://localhost:8080' }

if ($apiUrl -match 'localhost|127\.0\.0\.1') {
    Write-Warning @"
API_URL is $apiUrl
  - Firebase emulator / deploy: use your Render backend URL unless Spring Boot is running locally on :8080
  - After editing frontend/.env, redeploy: npm run deploy  (or npm run config && firebase deploy --only hosting)
"@
}

$content = @"
// Auto-generated from .env - do not commit. Re-run: npm run config
window.JOBTRACK_CONFIG = {
  supabaseUrl: '$($vars['SUPABASE_URL'])',
  supabaseAnonKey: '$($vars['SUPABASE_ANON_KEY'])',
  apiUrl: '$apiUrl',
};
"@

Set-Content -Path $outFile -Value $content -Encoding UTF8
Write-Host "Wrote $outFile"
