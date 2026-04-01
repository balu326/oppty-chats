# MongoDB Connection Test Script

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing MongoDB Connection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$uri = "mongodb+srv://reddybalaji326_db_user:Oppty123@cluster0.cdf0s9c.mongodb.net/oppty-chats?retryWrites=true&w=majority"

Write-Host "Database Information:" -ForegroundColor Yellow
Write-Host "  Database Name: oppty-chats" -ForegroundColor Cyan
Write-Host "  Cluster: cluster0.cdf0s9c.mongodb.net" -ForegroundColor Cyan
Write-Host "  Username: reddybalaji326_db_user" -ForegroundColor Cyan
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Cyan
Write-Host ""

try {
    $result = mongosh $uri --eval "db.adminCommand('ping')" --quiet 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "CONNECTION SUCCESSFUL!" -ForegroundColor Green
        Write-Host "" -ForegroundColor Green
        
        Write-Host "Checking collections..." -ForegroundColor Cyan
        
        $collections = mongosh $uri --eval "show collections" --quiet 2>&1
        
        if ($collections -and $collections -notmatch "ReferenceError") {
            Write-Host ""
            Write-Host "Collections found:" -ForegroundColor White
            $collections | ForEach-Object { 
                if ($_ -and $_.Trim()) {
                    Write-Host "  - $_" -ForegroundColor Gray 
                }
            }
            
            Write-Host ""
            Write-Host "Document Statistics:" -ForegroundColor Cyan
            
            $employees = mongosh $uri --eval "db.employees.countDocuments()" --quiet 2>&1
            $chats = mongosh $uri --eval "db.chats.countDocuments()" --quiet 2>&1
            $messages = mongosh $uri --eval "db.messages.countDocuments()" --quiet 2>&1
            
            Write-Host "  Employees: $employees" -ForegroundColor Yellow
            Write-Host "  Chats: $chats" -ForegroundColor Yellow
            Write-Host "  Messages: $messages" -ForegroundColor Yellow
            
        } else {
            Write-Host ""
            Write-Host "Fresh database - no collections yet!" -ForegroundColor Green
            Write-Host "This is perfect for production deployment!" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "Database is ready to use!" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "CONNECTION FAILED!" -ForegroundColor Red
        Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
    
} catch {
    Write-Host ""
    Write-Host "CONNECTION FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Troubleshooting Steps:" -ForegroundColor Yellow
    Write-Host "1. Check if mongosh is installed: mongosh --version" -ForegroundColor White
    Write-Host "2. Verify username/password in connection string" -ForegroundColor White
    Write-Host "3. Check MongoDB Atlas Network Access allows 0.0.0.0/0" -ForegroundColor White
    Write-Host "4. Verify internet connection" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
