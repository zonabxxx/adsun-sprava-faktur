# ⚡ QUICK START - 5 minút

Najrýchlejší spôsob, ako spustiť Faktúry API lokálne.

---

## 📋 Predpoklady

- [x] Node.js 14+ nainštalovaný
- [x] Google účet
- [x] 10 minút času

---

## 🚀 Krok za krokom (5 minút)

### 1. Google Cloud Setup (3 minúty)

#### A) Vytvor projekt
1. https://console.cloud.google.com/
2. New Project → `faktury-management` → Create

#### B) Povoľ API
1. APIs & Services → Library
2. Vyhľadaj: `Google Sheets API` → Enable

#### C) Vytvor Service Account
1. IAM & Admin → Service Accounts → Create
2. Meno: `faktury-bot` → Create → Done
3. Klikni na účet → Keys → Add Key → Create → JSON
4. Stiahni súbor → premenuj na `google-credentials.json`
5. **Skopíruj email** (napr. `faktury-bot@...iam.gserviceaccount.com`)

#### D) Vytvor Google Sheets
1. https://sheets.google.com/ → Blank
2. Premenuj na `Faktúry`
3. Premenuj Sheet1 na `faktury` (malé!)
4. Do A1 vlož (jeden riadok):
```
Číslo	Typ	Dátum vystavenia	Dátum dodania objednávky	Dátum dodania	Dátum splatnosti	Partner	Číslo partnera	Ulica	PSČ	Mesto	Kód krajiny	Krajina	IČO	DIČ	IČ DPH	Celkom s DPH	Celkom bez DPH	Základ - vyššia sadzba DPH	Základ - nižšia sadzba DPH 2	Základ - 0 sadzba DPH	Sadzba DPH vyššia	Sadzba DPH nižšia 2	Suma DPH - vyššia	Suma DPH - nižšia 2	Mena	Spôsob úhrady	Účet	IBAN	SWIFT	Variabilný symbol	Špecifický symbol	Konštantný symbol	Číslo objednávky	Firma	Vystavil	Uhradené zálohovou faktúrou	Uhradené zálohovou faktúrou bez DPH	Celkom bez uhradenej zálohy	Celkom bez uhradenej zálohy bez DPH	Zostáva uhradiť	Dátum úhrady	Číslo daň. dokladu k prijatej zálohe	Interná poznámka	Kategória	Podkategória	Číslo zákazky	Stredisko	Úvodný text
```
5. Share → vlož Service Account email → Editor → Share
6. **Skopíruj ID z URL** (časť medzi `/d/` a `/edit`)

---

### 2. Lokálne nastavenie (2 minúty)

```bash
# A) Nainštaluj dependencies
npm install

# B) Vytvor .env súbor
cp env.example .env

# C) Uprav .env (otvor v editore)
# Nastav:
# - API_KEY=tvoj_silny_tajny_kluc
# - SPREADSHEET_ID=id_z_google_sheets_url
# - GOOGLE_CREDENTIALS_PATH=./google-credentials.json

# D) Skopíruj google-credentials.json do projektu
# Uisti sa, že je v rovnakej zložke ako server.js

# E) Spusti server
npm start
```

**Výstup:**
```
🚀 Faktúry API beží na http://localhost:3000
🔑 API Key: ✓ nastavený
📄 Spreadsheet ID: ✓ nastavený
🔐 Google Credentials: ✓ nastavené
```

---

### 3. Test (30 sekúnd)

```bash
# Health check
curl http://localhost:3000/health

# Vytvor prvú faktúru
curl -X POST \
  -H "X-Faktury-API-Key: tvoj_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "partner": "Test Client, s.r.o.",
    "ico": "12345678",
    "celkom_bez_dph": 1000,
    "celkom_s_dph": 1200,
    "zaklad_vyssia_sadzba": 1000,
    "suma_dph_vyssia": 200,
    "datum_splatnosti": "2025-11-30",
    "vystavil": "API"
  }' \
  http://localhost:3000/api/faktury

# Zoznam faktúr
curl -H "X-Faktury-API-Key: tvoj_api_key" \
  http://localhost:3000/api/faktury
```

**Skontroluj Google Sheets** - mala by sa tam objaviť nová faktúra! ✅

---

## 🤖 ChatGPT Setup (voliteľné, +5 minút)

1. https://chat.openai.com/ → My GPTs → Create
2. Configure tab:
   - Name: `Faktúry Manager`
   - Description: `Správa faktúr v Google Sheets`
3. Instructions: Skopíruj z `CHATGPT_SETUP.md`
4. Actions:
   - Import `openapi.yaml`
   - Authentication: API Key
     - Header: `X-Faktury-API-Key`
     - Value: `tvoj_api_key`
5. Save

**Test GPT:**
```
Vytvor faktúru pre ADSUN, s.r.o., suma 1000 EUR bez DPH
```

---

## 🔧 Riešenie problémov

### ❌ "Permission denied"
→ Skontroluj, či je Google Sheets zdieľaný so Service Account

### ❌ "401 Unauthorized"
→ Skontroluj API_KEY v `.env` a v curl príkaze

### ❌ "Credentials not configured"
→ Skontroluj, či `google-credentials.json` existuje v zložke projektu

### ❌ "Spreadsheet not found"
→ Skontroluj SPREADSHEET_ID v `.env`

---

## 📚 Ďalšie kroky

- 📖 Prečítaj si `README.md` pre detailnú dokumentáciu
- 🚀 Pozri `DEPLOYMENT.md` pre produkčný deployment
- 🧪 Skús príklady v `EXAMPLES.md`
- 🤖 Nastav ChatGPT podľa `CHATGPT_SETUP.md`

---

**Hotovo za 5 minút!** 🎉

