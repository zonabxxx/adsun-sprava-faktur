# 🚂 RAILWAY DEPLOYMENT - Environment Variables

## Krok za krokom

### 1. Prihlásiť sa na Railway
https://railway.app/

### 2. Vytvor nový projekt
- Klikni **"New Project"**
- Vyber **"Deploy from GitHub repo"**
- Autorizuj GitHub a vyber: `zonabxxx/adsun-sprava-faktur`

### 3. Nastav Environment Variables

V Railway dashboarde:
1. Klikni na svoj projekt
2. Choď na záložku **"Variables"**
3. Pridaj tieto 3 premenné:

---

## 📋 Environment Variables pre Railway

### Variable 1: API_KEY
```
API_KEY
```
**Value:**
```
13b73451d48edd9b9d69963dcb7243a7c804663c
```

---

### Variable 2: SPREADSHEET_ID
```
SPREADSHEET_ID
```
**Value:**
```
12CEeWivulKjlCxUC1ZTWixcghLojhcx2O82DZ8be99w
```

---

### Variable 3: GOOGLE_CREDENTIALS_BASE64
```
GOOGLE_CREDENTIALS_BASE64
```
**Value:**
```
Skopíruj obsah súboru: credentials-base64.txt
(3160 znakov - jeden dlhý string bez medzier)
```

**Ako skopírovať:**

**MacOS:**
```bash
cat credentials-base64.txt | pbcopy
```
Potom Cmd+V v Railway

**Alebo otvor súbor a skopíruj:**
```bash
open credentials-base64.txt
```

---

## 4. Deploy

Po pridaní všetkých 3 premenných:
- Railway **automaticky deployuje** projekt
- Počkaj 2-3 minúty
- Dostaneš URL typu: `https://adsun-sprava-faktur-production.up.railway.app`

---

## 5. Test

### Health check:
```bash
curl https://tvoja-railway-url.up.railway.app/health
```

### Test API:
```bash
curl -H "X-Faktury-API-Key: 13b73451d48edd9b9d69963dcb7243a7c804663c" \
  https://tvoja-railway-url.up.railway.app/api/faktury | jq '.count'
```

Malo by vrátiť: `1442`

---

## 6. Aktualizuj OpenAPI pre ChatGPT

Po deployi aktualizuj súbor `openapi.yaml`:

Zmeň:
```yaml
servers:
  - url: https://tvoja-url.up.railway.app  # <-- NAHRAĎ TOTO
```

Na:
```yaml
servers:
  - url: https://adsun-sprava-faktur-production.up.railway.app  # tvoja Railway URL
```

---

## 🔧 Riešenie problémov

### "Invalid credentials"
- Overeť, že `GOOGLE_CREDENTIALS_BASE64` je správne skopírovaný
- Musí to byť **jeden riadok** bez medzier a nových riadkov

### "Spreadsheet not found"
- Skontroluj `SPREADSHEET_ID`
- Overeť, že tabuľka je zdieľaná so Service Account

### "Port already in use"
- Railway automaticky nastaví `PORT` - nemusíš ho pridávať

---

## 📊 Railway Dashboard

Po deployi budeš vidieť:
- **Deployments** - História deployov
- **Logs** - Real-time logy (tu vidíš chyby)
- **Metrics** - CPU, RAM, Network
- **Settings** - Domain, Environment

---

## 💰 Náklady

Railway Free Tier:
- **$5 kredit mesačne** zadarmo
- Stačí na malé projekty
- Potom $0.000463/GB-second

Odhadované náklady pre tento projekt:
- **~$3-5/mesiac** (pri pravidelnom používaní)

---

## 🔄 Aktualizácia projektu

Keď urobíš zmeny v kóde:

```bash
git add .
git commit -m "Update: opis zmien"
git push origin main
```

Railway **automaticky redeployuje** projekt.

---

## ✅ Checklist

- [ ] Railway projekt vytvorený z GitHub repo
- [ ] `API_KEY` nastavený
- [ ] `SPREADSHEET_ID` nastavený
- [ ] `GOOGLE_CREDENTIALS_BASE64` nastavený
- [ ] Deploy úspešný (zelený status)
- [ ] Health check funguje
- [ ] API test vracia 1442 faktúr
- [ ] Railway URL skopírovaná
- [ ] `openapi.yaml` aktualizovaný

---

**Railway URL použiješ v ChatGPT GPT nastavení!**

