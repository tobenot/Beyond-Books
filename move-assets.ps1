# Set script encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Set source and target directory paths
$sourceDir = (Resolve-Path ".\public\assets").Path
$targetDir = (Resolve-Path ".\public").Path

# Check if source directory exists
if (Test-Path $sourceDir) {
    # Get all files recursively and move them
    Get-ChildItem -Path $sourceDir -File -Recurse | ForEach-Object {
        # Calculate relative path and new destination
        $relativePath = $_.DirectoryName.Replace($sourceDir, $targetDir)
        $destination = Join-Path $relativePath $_.Name
        
        # Create target subdirectory if it doesn't exist
        if (!(Test-Path $relativePath)) {
            New-Item -ItemType Directory -Path $relativePath -Force | Out-Null
        }
        
        # Use git mv command to move files
        git mv "$($_.FullName)" "$destination"
        Write-Host "Moved file: $($_.FullName) -> $destination"
    }
    Write-Host "All files moved successfully"
} else {
    Write-Host "Error: Source directory $sourceDir does not exist"
}