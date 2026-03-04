# Deploy create-employee edge function to Supabase
# Usage: .\deploy-edge-function.ps1 -AccessToken "your_supabase_access_token"
#
# Get your access token from: https://supabase.com/dashboard/account/tokens

param(
    [Parameter(Mandatory=$true)]
    [string]$AccessToken
)

$ProjectRef = "agpfctpfjdfyngwoomyi"
$FunctionName = "create-employee"
$FunctionFile = "$PSScriptRoot\edge-functions\create-employee\index.ts"

# Read the edge function source
$FunctionCode = Get-Content $FunctionFile -Raw

# Use Supabase Management API to deploy
$Headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"  = "application/json"
}

# Build the multipart request body as JSON for the Management API
$Body = @{
    slug = $FunctionName
    files = @(
        @{
            name = "index.ts"
            content = $FunctionCode
        }
    )
    entrypoint_path = "index.ts"
    verify_jwt = $true
} | ConvertTo-Json -Depth 5

$Url = "https://api.supabase.com/v1/projects/$ProjectRef/functions/$FunctionName"

Write-Host "Deploying '$FunctionName' to project $ProjectRef ..."

try {
    $Response = Invoke-RestMethod -Uri $Url -Method Put -Headers $Headers -Body $Body -ContentType "application/json"
    Write-Host "✓ Edge function deployed successfully!" -ForegroundColor Green
    Write-Host ($Response | ConvertTo-Json)
} catch {
    # Try POST if PUT fails (function might not exist yet)
    $PostUrl = "https://api.supabase.com/v1/projects/$ProjectRef/functions"
    try {
        $Response = Invoke-RestMethod -Uri $PostUrl -Method Post -Headers $Headers -Body $Body -ContentType "application/json"
        Write-Host "✓ Edge function created and deployed successfully!" -ForegroundColor Green
        Write-Host ($Response | ConvertTo-Json)
    } catch {
        Write-Host "✗ Deployment failed: $_" -ForegroundColor Red
    }
}
