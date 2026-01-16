# lex.ps1 — скрипт для проверки API бэкенда

$BASE = "http://severin-gif-lex-back-29f5.twc1.net:8080"

Write-Host "== Health-check =="
Invoke-RestMethod "$BASE/"

# регистрация (вернёт 409 если пользователь уже есть)
$regBody = @{ email = "test@example.com"; password = "Secret123" } | ConvertTo-Json
try {
  Invoke-RestMethod -Method POST -Uri "$BASE/auth/register" -Headers @{ "Content-Type"="application/json; charset=utf-8" } -Body ([System.Text.Encoding]::UTF8.GetBytes($regBody))
} catch { Write-Host "Регистрация: " $_.Exception.Message }

# логин
$loginBody = @{ email = "test@example.com"; password = "Secret123" } | ConvertTo-Json
$login = Invoke-RestMethod -Method POST -Uri "$BASE/auth/login" -Headers @{ "Content-Type"="application/json; charset=utf-8" } -Body ([System.Text.Encoding]::UTF8.GetBytes($loginBody))
$token = $login.access_token
Write-Host "TOKEN: $token"

# создать чат
$newChatBody = @{ title = "Первый тестовый чат" } | ConvertTo-Json
$chat = Invoke-RestMethod -Method POST -Uri "$BASE/chat" -Headers @{ "Authorization"="Bearer $token"; "Content-Type"="application/json; charset=utf-8" } -Body ([System.Text.Encoding]::UTF8.GetBytes($newChatBody))
$chat | ConvertTo-Json -Depth 5

# список чатов
$chats = Invoke-RestMethod -Method GET -Uri "$BASE/chat" -Headers @{ "Authorization"="Bearer $token" }
$chats | ConvertTo-Json -Depth 5

# отправить сообщение
$chatId = $chat.id
$msgBody = @{ chatId = $chatId; content = "Привет из lex.ps1" } | ConvertTo-Json
$msg = Invoke-RestMethod -Method POST -Uri "$BASE/chat/send" -Headers @{ "Authorization"="Bearer $token"; "Content-Type"="application/json; charset=utf-8" } -Body ([System.Text.Encoding]::UTF8.GetBytes($msgBody))
$msg | ConvertTo-Json -Depth 5
