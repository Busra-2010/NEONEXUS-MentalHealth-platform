# Create thumbnail images for resources using online placeholder service
$thumbnailDir = "public\resources\thumbnails"

# Ensure the directory exists
if (!(Test-Path $thumbnailDir)) {
    New-Item -ItemType Directory -Force -Path $thumbnailDir
}

# Define thumbnail images to create
$thumbnails = @(
    @{
        name = "exam-stress.jpg"
        url = "https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Exam+Stress+Management"
    },
    @{
        name = "sleep.jpg"
        url = "https://via.placeholder.com/300x200/10B981/FFFFFF?text=Sleep+Hygiene"
    },
    @{
        name = "academic.jpg"
        url = "https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Academic+Pressure"
    },
    @{
        name = "mindfulness.jpg"
        url = "https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=Mindfulness+Guide"
    },
    @{
        name = "social-anxiety.jpg"
        url = "https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Social+Anxiety"
    },
    @{
        name = "depression.jpg"
        url = "https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Understanding+Depression"
    },
    @{
        name = "stress-ks.jpg"
        url = "https://via.placeholder.com/300x200/06B6D4/FFFFFF?text=Stress+Management"
    },
    @{
        name = "mental-health-doi.jpg"
        url = "https://via.placeholder.com/300x200/84CC16/FFFFFF?text=Mental+Health+Care"
    }
)

# Download each thumbnail
foreach ($thumbnail in $thumbnails) {
    $filePath = Join-Path $thumbnailDir $thumbnail.name
    try {
        Write-Host "Creating thumbnail: $($thumbnail.name)..."
        Invoke-WebRequest -Uri $thumbnail.url -OutFile $filePath -ErrorAction Stop
        Write-Host "Created: $($thumbnail.name)" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to create: $($thumbnail.name)" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)"
    }
}

Write-Host "Thumbnail creation complete!" -ForegroundColor Cyan