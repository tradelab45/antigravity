$ErrorActionPreference = "Continue"
$env:NODE_ENV = "production"
$env:PORT = "3000"
$env:PATH = "C:\Users\Admin\AppData\Local\OpenAI\Codex\runtimes\cua_node\b58ca2eaa616c2da\bin;" + $env:PATH
$node = "C:\Users\Admin\AppData\Local\OpenAI\Codex\runtimes\cua_node\b58ca2eaa616c2da\bin\node.exe"
$scriptDir = "C:\Users\Admin\.gemini\antigravity\scratch\rupeerookie"

Write-Output "[Supervisor] Starting RupeeRookie Server Daemon on port 3000..."

while ($true) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $node
    $psi.Arguments = "dist/server.cjs"
    $psi.WorkingDirectory = $scriptDir
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $false
    $psi.RedirectStandardError = $false

    $proc = [System.Diagnostics.Process]::Start($psi)
    if ($proc) {
        try {
            $proc.ProcessorAffinity = [IntPtr]1
            Write-Output "[Supervisor] RupeeRookie process PID $($proc.Id) pinned to CPU Core 0."
        } catch {
            Write-Output "[Supervisor] Affinity notice: $_"
        }
        $proc.WaitForExit()
        Write-Output "[Supervisor] Process $($proc.Id) exited with code $($proc.ExitCode). Reviving in 1s..."
    }
    Start-Sleep -Seconds 1
}
