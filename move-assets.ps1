# Set script encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Set source and target directory paths
$sourceDir = (Resolve-Path ".\public").Path
$targetDir = (Resolve-Path ".\public\assets").Path

# Check if source directory exists
if (Test-Path $sourceDir) {
    # Check if target directory exists, create if not
    if (!(Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        Write-Host "Created target directory: $targetDir"
    }

    # Recursively get all files and move them, excluding the assets folder
    Get-ChildItem -Path $sourceDir -File -Recurse | Where-Object { $_.FullName -notlike "*\assets\*" } | ForEach-Object {
        # Calculate relative path and new target location
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
    Write-Host "All files have been successfully moved"
} else {
    Write-Host "Error: Source directory $sourceDir does not exist"
}
