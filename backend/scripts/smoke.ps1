param([Parameter(Mandatory = $true)][string]$BaseUrl)
# Run only against a disposable test deployment: creates users, workspace, and documents.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$client = New-Object System.Net.Http.HttpClient
function Call-Api($method, $path, $body = $null, $token = $null, $status = 200) {
    $request = New-Object System.Net.Http.HttpRequestMessage ([System.Net.Http.HttpMethod]::new($method)), ($BaseUrl.TrimEnd('/') + $path)
    if ($token) { $request.Headers.Authorization = New-Object System.Net.Http.Headers.AuthenticationHeaderValue 'Bearer', $token }
    if ($null -ne $body) {
        $request.Content = New-Object System.Net.Http.StringContent ($body | ConvertTo-Json -Depth 10 -Compress), ([System.Text.Encoding]::UTF8), 'application/json'
    }
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    try {
        if ([int]$response.StatusCode -ne $status) { throw "$method $path expected $status; got $([int]$response.StatusCode)." }
        $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        if ($text -and $response.Content.Headers.ContentType.MediaType -eq 'application/json') { return ($text | ConvertFrom-Json) }
    } finally { $response.Dispose(); $request.Dispose() }
}
try {
    $suffix = [Guid]::NewGuid().ToString('N')
    $owner = Call-Api POST '/api/auth/register' @{email="owner-$suffix@example.test"; password='SmokePassword123!'; name='Owner'} $null 201
    $guest = Call-Api POST '/api/auth/register' @{email="guest-$suffix@example.test"; password='SmokePassword123!'; name='Guest'} $null 201
    $ownerToken = $owner.accessToken
    $workspace = Call-Api POST '/api/workspaces' @{name="Smoke-$suffix"} $ownerToken 201
    $membership = Call-Api POST "/api/workspaces/$($workspace.id)/members" @{email=$guest.user.email; role='Guest'} $ownerToken 201
    Call-Api PATCH "/api/workspaces/$($workspace.id)/members/$($membership.id)" @{role='Guest'} $ownerToken | Out-Null
    $page = Call-Api POST "/api/workspaces/$($workspace.id)/pages" @{title='Smoke'; content='{"type":"doc","content":[]}'} $ownerToken 201
    $child = Call-Api POST "/api/workspaces/$($workspace.id)/pages" @{parentId=$page.id; title='Child'} $ownerToken 201
    function Upload-Fixture($name, $mime, $status) {
        $multipart = New-Object System.Net.Http.MultipartFormDataContent
        $bytes = [System.Text.Encoding]::UTF8.GetBytes('%PDF-1.7 fixture')
        $fileContent = [System.Net.Http.ByteArrayContent]::new($bytes)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::new($mime)
        $multipart.Add($fileContent, 'file', $name)
        $multipart.Add([System.Net.Http.StringContent]::new($page.id), 'pageId')
        $uploadRequest = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Post, "$BaseUrl/api/files")
        $uploadRequest.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new('Bearer', $ownerToken)
        $uploadRequest.Content = $multipart
        $uploadResponse = $client.SendAsync($uploadRequest).GetAwaiter().GetResult()
        try {
            if ([int]$uploadResponse.StatusCode -ne $status) { throw "Upload fixture expected $status; got $([int]$uploadResponse.StatusCode)." }
            return ($uploadResponse.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json)
        } finally { $uploadResponse.Dispose(); $uploadRequest.Dispose() }
    }
    $attachment = Upload-Fixture 'fixture.pdf' 'application/pdf' 201
    Upload-Fixture 'fake.png' 'image/png' 422 | Out-Null
    Call-Api GET "/api/files/$($attachment.id)/download" $null $ownerToken | Out-Null
    Call-Api GET "/api/files/$($attachment.id)/download" $null $null 403 | Out-Null
    Call-Api PUT "/api/pages/$($page.id)/content" @{content='{"type":"doc","content":[]}'} $guest.accessToken 403 | Out-Null
    Call-Api PUT "/api/pages/$($page.id)/content" @{content='{"type":"doc","content":[{"type":"paragraph"}]}'} $ownerToken | Out-Null
    $versions = @(Call-Api GET "/api/pages/$($page.id)/versions" $null $ownerToken)
    if ($versions.Count -lt 1) { throw 'Content save did not produce history.' }
    Call-Api POST "/api/pages/$($page.id)/versions/$($versions[0].id)/restore" $null $ownerToken | Out-Null
    Call-Api GET "/api/public/pages/$($page.id)" $null $null 404 | Out-Null
    Call-Api POST "/api/pages/$($page.id)/public" @{isPublic=$true} $ownerToken | Out-Null
    $public = Call-Api GET "/api/public/pages/$($page.id)"
    if ($public.PSObject.Properties.Name -contains 'workspaceId') { throw 'Public DTO leaked private metadata.' }
    Call-Api GET "/api/files/$($attachment.id)/download" | Out-Null
    Call-Api DELETE "/api/pages/$($page.id)" $null $ownerToken 204 | Out-Null
    Call-Api GET "/api/files/$($attachment.id)/download" $null $null 403 | Out-Null
    Call-Api POST "/api/pages/$($page.id)/restore" $null $ownerToken | Out-Null
    Call-Api POST "/api/pages/$($page.id)/public" @{isPublic=$false} $ownerToken | Out-Null
    Call-Api GET "/api/public/pages/$($page.id)" $null $null 404 | Out-Null
    Call-Api DELETE "/api/pages/$($page.id)" $null $ownerToken 204 | Out-Null
    Call-Api POST "/api/pages/$($page.id)/restore" $null $ownerToken | Out-Null
    $tree = @(Call-Api GET "/api/workspaces/$($workspace.id)/pages" $null $ownerToken)
    if ($tree.Count -ne 2) { throw 'Subtree restore failed.' }
    $ai = Call-Api POST '/api/ai/generate' @{prompt='Summarize'; pageId=$page.id} $ownerToken
    if (-not $ai.response.StartsWith('[Demo AI]')) { throw 'AI mode is not accurately labeled.' }
    $notifications = @(Call-Api GET '/api/notifications' $null $guest.accessToken)
    if ($notifications.Count -lt 1) { throw 'Workspace event did not produce a notification.' }
    $rotated = Call-Api POST '/api/auth/refresh' @{refreshToken=$owner.refreshToken}
    Call-Api POST '/api/auth/refresh' @{refreshToken=$owner.refreshToken} $null 401 | Out-Null
    Call-Api POST '/api/auth/logout' @{refreshToken=$rotated.refreshToken} $null 204 | Out-Null
    Call-Api POST '/api/auth/refresh' @{refreshToken=$rotated.refreshToken} $null 401 | Out-Null
    'PASS: auth/rotation/logout, role PATCH and enforcement, editor/history, public sharing, upload/download/archive protection, subtree restoration, Demo AI, notifications.'
} finally { $client.Dispose() }
