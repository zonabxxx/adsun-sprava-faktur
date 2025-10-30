# 🚀 Deployment Guide - Railway

## Rýchle nastavenie Railway

### 1. Príprava Base64 credentials

**MacOS/Linux:**
```bash
cat google-credentials.json | base64 | tr -d '\n' > credentials-base64.txt
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-credentials.json")) | Out-File credentials-base64.txt
```

### 2. Railway Environment Variables

Nastav v Railway Dashboard > Variables:

```env
# API autentifikácia
API_KEY=sk_faktury_secret_key_CHANGE_THIS_TO_RANDOM_STRING

# Google Sheets ID
SPREADSHEET_ID=your_spreadsheet_id_here

# Google Credentials (Base64)
GOOGLE_CREDENTIALS_BASE64=paste_base64_content_here

# Port (voliteľné, Railway nastaví automaticky)
# PORT=3000
```

### 3. Deploy príkazy

Railway automaticky detekuje Node.js projekt a spustí:
```bash
npm install
npm start
```

### 4. Po deploye

1. Skopíruj vygenerovanú URL (napr. `https://projekt.up.railway.app`)
2. Otestuj:
   ```bash
   curl https://tvoja-url.up.railway.app/health
   ```
3. Aktualizuj `openapi.yaml` s novou URL
4. Nastav akciu v ChatGPT

---

## Alternatívy k Railway

### Heroku

```bash
# Prihlásenie
heroku login

# Vytvorenie aplikácie
heroku create faktury-api

# Nastavenie environment variables
heroku config:set API_KEY=sk_faktury_secret_key
heroku config:set SPREADSHEET_ID=your_id
heroku config:set GOOGLE_CREDENTIALS_BASE64=your_base64

# Deploy
git push heroku main
```

### Render

1. Choď na: https://render.com/
2. Vytvor **Web Service**
3. Pripoj GitHub repozitár
4. Environment:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Pridaj Environment Variables (rovnaké ako Railway)

### Vercel

**Poznámka:** Vercel je optimalizovaný pre serverless, nie pre Express server. Odporúčame Railway alebo Render.

---

## Troubleshooting

### Railway logs
```bash
railway logs
```

### Skontroluj environment variables
V Railway Dashboard > Variables > overeň všetky 3 premenné

### Skontroluj Base64 encoding
Dekóduj a overeď:
```bash
echo "tvoj_base64" | base64 -d | jq
```

Malo by to vrátiť validný JSON objekt.

