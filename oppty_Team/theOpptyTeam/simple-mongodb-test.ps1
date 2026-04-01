# Simple MongoDB Connection Test (No mongosh required)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB Connection Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$uri = "mongodb+srv://reddybalaji326_db_user:Oppty123@cluster0.cdf0s9c.mongodb.net/oppty-chats?retryWrites=true&w=majority"

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Database: oppty-chats" -ForegroundColor White
Write-Host "  Cluster: cluster0.cdf0s9c.mongodb.net" -ForegroundColor White
Write-Host "  Username: reddybalaji326_db_user" -ForegroundColor White
Write-Host ""

Write-Host "Testing with Node.js..." -ForegroundColor Cyan
Write-Host ""

# Test using Node.js mongodb driver (ES modules)
$testScript = @"
import { MongoClient } from 'mongodb';

const uri = "$uri";
const client = new MongoClient(uri);

async function test() {
  try {
    await client.connect();
    console.log('SUCCESS');
    
    const db = client.db('oppty-chats');
    const collections = await db.listCollections().toArray();
    
    console.log('Collections:', collections.length);
    collections.forEach(col => {
      console.log('  - ' + col.name);
    });
    
    await client.close();
  } catch (error) {
    console.log('ERROR: ' + error.message);
    process.exit(1);
  }
}

test();
"@

# Save test script as .mjs (ES module)
$testScript | Out-File -FilePath "test-db-temp.mjs" -Encoding utf8

# Run the test
Write-Host "Connecting to MongoDB Atlas..." -ForegroundColor Cyan
$result = node test-db-temp.mjs 2>&1

if ($result -match "SUCCESS") {
    Write-Host ""
    Write-Host "CONNECTION SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    
    if ($result -match "Collections: (\d+)") {
        $count = $matches[1]
        if ([int]$count -gt 0) {
            Write-Host "Collections found:" -ForegroundColor White
            $result | Select-String "^\s+-" | ForEach-Object {
                Write-Host $_.Line.Trim() -ForegroundColor Gray
            }
        } else {
            Write-Host "Fresh database - no collections yet!" -ForegroundColor Green
            Write-Host "Perfect for production deployment!" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "Database is ready!" -ForegroundColor Green
    
} elseif ($result -match "ERROR") {
    Write-Host ""
    Write-Host "CONNECTION FAILED!" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "  1. Internet connection" -ForegroundColor White
    Write-Host "  2. MongoDB Atlas credentials" -ForegroundColor White
    Write-Host "  3. Network Access in Atlas (allow 0.0.0.0/0)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Test result:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor Gray
}

# Cleanup
Remove-Item "test-db-temp.mjs" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
