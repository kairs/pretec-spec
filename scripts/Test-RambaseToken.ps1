<#
.SYNOPSIS
    Requests an OAuth2 access token from RamBase and prints it to the console.

.DESCRIPTION
    Quick test harness for verifying RamBase API access. For unattended
    server-to-server integration the correct grant type is 'client_credentials'.
    'authorization_code' is NOT suitable for server-to-server because it requires
    an interactive user login in a browser.

    Credentials are read from parameters or environment variables so they are
    never hard-coded into the repo:
        RAMBASE_CLIENT_ID
        RAMBASE_CLIENT_SECRET

.EXAMPLE
    $env:RAMBASE_CLIENT_ID     = "PG9E7ku9Jkq_sc4669ORMw2"
    $env:RAMBASE_CLIENT_SECRET = "QhdgmH6nPkORMdOS-ULFLw2"
    ./scripts/Test-RambaseToken.ps1

.EXAMPLE
    ./scripts/Test-RambaseToken.ps1 -ClientId "..." -ClientSecret "..." -GrantType client_credentials
#>
[CmdletBinding()]
param(
    [string]$TokenUrl    = "https://api.rambase.net/oauth2/access_token",
    [string]$ClientId    = $env:RAMBASE_CLIENT_ID,
    [string]$ClientSecret = $env:RAMBASE_CLIENT_SECRET,

    [ValidateSet("client_credentials", "password", "authorization_code")]
    [string]$GrantType   = "client_credentials",

    # Only used when GrantType = 'password'
    [string]$Username    = $env:RAMBASE_USERNAME,
    [string]$Password    = $env:RAMBASE_PASSWORD
)

if (-not $ClientId -or -not $ClientSecret) {
    Write-Error "Missing credentials. Set RAMBASE_CLIENT_ID and RAMBASE_CLIENT_SECRET (or pass -ClientId / -ClientSecret)."
    exit 1
}

$body = @{
    grant_type    = $GrantType
    client_id     = $ClientId
    client_secret = $ClientSecret
}

if ($GrantType -eq "password") {
    $body.username = $Username
    $body.password = $Password
}

Write-Host "POST $TokenUrl  (grant_type=$GrantType)" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Method Post -Uri $TokenUrl `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $body -ErrorAction Stop

    Write-Host "`nAccess granted." -ForegroundColor Green
    Write-Host "access_token : $($response.access_token)"
    if ($response.token_type)    { Write-Host "token_type   : $($response.token_type)" }
    if ($response.expires_in)    { Write-Host "expires_in   : $($response.expires_in) seconds" }
    if ($response.refresh_token) { Write-Host "refresh_token: $($response.refresh_token)" }
}
catch {
    Write-Host "`nToken request failed." -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "HTTP $([int]$_.Exception.Response.StatusCode) $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
    # In PowerShell 7 the response body for a failed request is exposed here:
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
    else {
        Write-Host $_.Exception.Message
    }
    exit 1
}
