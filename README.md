# 📋 Faktúry GPT - Automatizácia správy faktúr v Google Sheets

Kompletný systém pre správu faktúr pomocou ChatGPT a Google Sheets API.

## 🎯 Funkcie

- ✅ Vytvorenie novej faktúry pomocou prirodzeného jazyka
- ✅ Zobrazenie zoznamu všetkých faktúr
- ✅ Zobrazenie detailu konkrétnej faktúry
- ✅ Aktualizácia existujúcej faktúry
- ✅ Označenie faktúry ako zaplatenej
- ✅ Vyhľadávanie faktúr podľa partnera, dátumu, stavu
- ✅ Štatistiky (celková suma, nezaplatené, zaplatené)
- ✅ Automatické generovanie čísla faktúry

---

## 🚀 Rýchly štart

### 1. Príprava Google Cloud projektu

#### 1.1 Vytvorenie projektu
1. Choď na: https://console.cloud.google.com/
2. Klikni **"New Project"**
3. Názov: `faktury-management`
4. Klikni **"Create"**

#### 1.2 Povolenie Google Sheets API
1. V projekte choď na: **APIs & Services > Library**
2. Vyhľadaj: `Google Sheets API`
3. Klikni **"Enable"**

#### 1.3 Vytvorenie Service Account
1. Choď na: **IAM & Admin > Service Accounts**
2. Klikni **"Create Service Account"**
3. Názov: `faktury-bot`
4. Email sa vygeneruje automaticky (napr. `faktury-bot@faktury-management.iam.gserviceaccount.com`)
5. Klikni **"Done"** (žiadna rola nie je potrebná)

#### 1.4 Vytvorenie kľúča (credentials)
1. Klikni na vytvorený Service Account
2. Choď na záložku **"Keys"**
3. Klikni **"Add Key" > "Create new key"**
4. Typ: **JSON**
5. Klikni **"Create"**
6. Stiahne sa súbor (napr. `faktury-management-abc123.json`)
7. **Ulož ho do zložky projektu a premenuj na `google-credentials.json`**

---

### 2. Príprava Google Sheets

#### 2.1 Vytvorenie tabuľky
1. Vytvor nový Google Sheets dokument
2. Premenuj ho na **"Faktúry"**
3. Premenuj prvý sheet na **"faktury"** (malé písmená!)

#### 2.2 Pridanie hlavičky
Pridaj do prvého riadku (A1:AW1) tieto stĺpce:

```
Číslo | Typ | Dátum vystavenia | Dátum dodania objednávky | Dátum dodania | Dátum splatnosti | Partner | Číslo partnera | Ulica | PSČ | Mesto | Kód krajiny | Krajina | IČO | DIČ | IČ DPH | Celkom s DPH | Celkom bez DPH | Základ - vyššia sadzba DPH | Základ - nižšia sadzba DPH 2 | Základ - 0 sadzba DPH | Sadzba DPH vyššia | Sadzba DPH nižšia 2 | Suma DPH - vyššia | Suma DPH - nižšia 2 | Mena | Spôsob úhrady | Účet | IBAN | SWIFT | Variabilný symbol | Špecifický symbol | Konštantný symbol | Číslo objednávky | Firma | Vystavil | Uhradené zálohovou faktúrou | Uhradené zálohovou faktúrou bez DPH | Celkom bez uhradenej zálohy | Celkom bez uhradenej zálohy bez DPH | Zostáva uhradiť | Dátum úhrady | Číslo daň. dokladu k prijatej zálohe | Interná poznámka | Kategória | Podkategória | Číslo zákazky | Stredisko | Úvodný text
```

**Tip:** Môžeš skopírovať tento riadok a vložiť do bunky A1, rozdelí sa automaticky.

#### 2.3 Zdieľanie tabuľky so Service Account
1. Klikni na **"Share"** (Zdieľať) v pravom hornom rohu
2. Pridaj **Service Account email** z `google-credentials.json` (nájdeš ho ako `client_email`)
   - Napr.: `faktury-bot@faktury-management.iam.gserviceaccount.com`
3. Práva: **Editor**
4. **Odškrtni** "Notify people" (neposielaj notifikácie)
5. Klikni **"Share"**

#### 2.4 Skopíruj Spreadsheet ID
Z URL tabuľky skopíruj ID:
```
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       toto je SPREADSHEET_ID
```

---

### 3. Lokálna inštalácia a spustenie

#### 3.1 Nainštaluj závislosti
```bash
npm install
```

#### 3.2 Vytvor `.env` súbor
Skopíruj `env.example` a premenuj na `.env`:

```bash
cp env.example .env
```

#### 3.3 Nastav konfiguráciu v `.env`
```env
PORT=3000
API_KEY=sk_faktury_secret_key_ZMEN_TO
SPREADSHEET_ID=tvoj_spreadsheet_id_tu
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
```

**Dôležité:**
- `API_KEY` - Zvol silný tajný kľúč (používa sa pre autentifikáciu ChatGPT)
- `SPREADSHEET_ID` - ID z URL tvojho Google Sheets dokumentu
- `GOOGLE_CREDENTIALS_PATH` - Cesta k stiahnutému JSON súboru

#### 3.4 Spusti server
```bash
npm start
```

Výstup:
```
🚀 Faktúry API beží na http://localhost:3000
📊 Endpoints:
   GET    /health
   GET    /api/faktury
   ...
🔑 API Key: ✓ nastavený
📄 Spreadsheet ID: ✓ nastavený
🔐 Google Credentials: ✓ nastavené
```

#### 3.5 Otestuj API
```bash
curl http://localhost:3000/health
```

Odpoveď:
```json
{"status":"OK","message":"Faktúry API beží","timestamp":"2025-10-30T..."}
```

---

## 🌐 Deployment na Railway

### 1. Príprava credentials pre Railway

Railway nepodporuje súbory, preto musíš skonvertovať `google-credentials.json` na Base64:

```bash
cat google-credentials.json | base64 | tr -d '\n'
```

**Na Windowse (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-credentials.json"))
```

Skopíruj výstup.

### 2. Deploy na Railway

#### 2.1 Vytvor Railway projekt
1. Choď na: https://railway.app/
2. Klikni **"New Project"**
3. Vyber **"Deploy from GitHub repo"**
4. Autorizuj GitHub a vyber svoj repozitár

#### 2.2 Nastav environment variables
V Railway dashboarde:
1. Choď na záložku **"Variables"**
2. Pridaj tieto premenné:

```
API_KEY=sk_faktury_secret_key_ZMEN_TO
SPREADSHEET_ID=tvoj_spreadsheet_id
GOOGLE_CREDENTIALS_BASE64=tvoj_base64_string_tu
```

**Poznámka:** `GOOGLE_CREDENTIALS_BASE64` obsahuje celý base64 string z kroku 1.

#### 2.3 Deploy
Railway automaticky deployne projekt. Po dokončení dostaneš URL typu:
```
https://sprava-faktur-adsun-production.up.railway.app
```

#### 2.4 Otestuj produkciu
```bash
curl https://tvoja-url.up.railway.app/health
```

---

## 🤖 Konfigurácia ChatGPT

### 1. Vytvor vlastného GPT

1. Choď na: https://chat.openai.com/
2. Klikni na svoje meno > **"My GPTs"**
3. Klikni **"Create a GPT"**

### 2. Základné nastavenia

**Name:**
```
Faktúry Manager
```

**Description:**
```
Asistent pre správu faktúr v Google Sheets. Pomôže ti vytvoriť, upraviť, vyhľadať a spravovať faktúry.
```

**Instructions:**
```
Si AI asistent pre správu faktúr v Google Sheets. Tvoje úlohy:

1. **Vytváranie faktúr:** Spýtaj sa používateľa na potrebné údaje (partner, sumy, dátum splatnosti) a vytvor faktúru v systéme.

2. **Zobrazovanie faktúr:** Umožni zobraziť zoznam všetkých faktúr, detail konkrétnej faktúry alebo vyhľadať faktúry podľa kritérií.

3. **Aktualizácia faktúr:** Umožni upraviť existujúcu faktúru.

4. **Označovanie ako zaplatené:** Jednoducho označ faktúru ako zaplatenú.

5. **Štatistiky:** Zobraz prehľad o celkovom počte faktúr, sumách, nezaplatených a zaplatených faktúrach.

**Komunikácia:**
- Vždy používaj slovenčinu
- Buď priateľský a profesionálny
- Pri vytváraní faktúry sa spýtaj postupne na potrebné údaje
- Ak niektoré údaje chýbajú, požiadaj o ne
- Pri zobrazovaní faktúr formátuj výstup prehľadne

**Automatické hodnoty:**
- Dátum vystavenia: dnes (ak nie je uvedený)
- Mena: EUR (ak nie je uvedená)
- Číslo faktúry: automaticky sa vygeneruje
- Variabilný symbol: rovnaký ako číslo faktúry

**DPH kalkulácia:**
- Vyššia sadzba: 20%
- Nižšia sadzba: 10%
- Pri vytváraní faktúry vypočítaj automaticky:
  - Ak používateľ uvedie sumu s DPH, vypočítaj bez DPH a DPH
  - Ak uvedie sumu bez DPH, vypočítaj DPH a celkom s DPH

**Príklady komunikácie:**

Používateľ: "Vytvor faktúru pre ADSUN"
Ty: "Rád vytvorím faktúru pre ADSUN. Potrebujem ešte pár informácií:
- Aká je celková suma s DPH?
- Kedy má byť splatnosť?
- Potrebuješ pridať nejaké poznámky?"

Používateľ: "Zobraz mi všetky nezaplatené faktúry"
Ty: [Zavoláš API s parametrom zaplatene=false a zobrazíš prehľadne]

Používateľ: "Označ faktúru 2025001 ako zaplatenú"
Ty: [Zavoláš endpoint na zaplatenie a potvrdíš]
```

**Conversation starters:**
```
Vytvor novú faktúru
Zobraz mi všetky faktúry
Aké mám nezaplatené faktúry?
Zobraz štatistiky
```

### 3. Konfigurácia Actions

1. V sekcii **"Actions"** klikni **"Create new action"**
2. Otvor `openapi.yaml` a skopíruj celý obsah
3. Vlož ho do editora
4. **Aktualizuj URL:** V riadku `servers:` zmeň URL na tvoju Railway URL:
   ```yaml
   servers:
     - url: https://tvoja-url.up.railway.app
   ```
5. Klikni **"Save"**

### 4. Konfigurácia autentifikácie

1. V sekcii **"Authentication"** vyber **"API Key"**
2. Nastavenia:
   - **Auth Type:** Custom
   - **Custom Header Name:** `X-Faktury-API-Key`
   - **API Key:** `sk_faktury_secret_key_ZMEN_TO` (ten istý ako v `.env`)
3. Klikni **"Save"**

### 5. Publikovanie GPT

1. Klikni **"Save"** (pravý horný roh)
2. Vyber **"Only me"** (len pre teba) alebo **"Anyone with a link"**
3. Klikni **"Confirm"**

---

## 🧪 Testovanie

### Testovanie cez ChatGPT

**Príklad 1: Vytvorenie faktúry**
```
Vytvor faktúru pre klienta ADSUN, s.r.o., IČO 12345678, 
suma bez DPH 1000 EUR, vyššia sadzba DPH 20%, 
splatnosť 15.11.2025
```

**Príklad 2: Zoznam faktúr**
```
Zobraz mi všetky faktúry
```

**Príklad 3: Vyhľadávanie**
```
Zobraz mi všetky nezaplatené faktúry pre partnera ADSUN
```

**Príklad 4: Označenie ako zaplatené**
```
Označ faktúru 2025001 ako zaplatenú bankovým prevodom
```

**Príklad 5: Štatistiky**
```
Aké sú aktuálne štatistiky faktúr?
```

### Testovanie cez curl

**GET všetky faktúry:**
```bash
curl -H "X-Faktury-API-Key: sk_faktury_secret_key_ZMEN_TO" \
  https://tvoja-url.up.railway.app/api/faktury
```

**POST nová faktúra:**
```bash
curl -X POST \
  -H "X-Faktury-API-Key: sk_faktury_secret_key_ZMEN_TO" \
  -H "Content-Type: application/json" \
  -d '{
    "partner": "ADSUN, s.r.o.",
    "ico": "12345678",
    "celkom_bez_dph": 1000,
    "celkom_s_dph": 1200,
    "suma_dph_vyssia": 200,
    "zaklad_vyssia_sadzba": 1000,
    "datum_splatnosti": "2025-11-15",
    "vystavil": "Test"
  }' \
  https://tvoja-url.up.railway.app/api/faktury
```

**GET detail faktúry:**
```bash
curl -H "X-Faktury-API-Key: sk_faktury_secret_key_ZMEN_TO" \
  https://tvoja-url.up.railway.app/api/faktury/2025001
```

**PUT označiť ako zaplatené:**
```bash
curl -X PUT \
  -H "X-Faktury-API-Key: sk_faktury_secret_key_ZMEN_TO" \
  -H "Content-Type: application/json" \
  -d '{
    "datum_uhrady": "2025-10-30",
    "sposob_uhrady": "bankový prevod"
  }' \
  https://tvoja-url.up.railway.app/api/faktury/2025001/zaplatit
```

**GET štatistiky:**
```bash
curl -H "X-Faktury-API-Key: sk_faktury_secret_key_ZMEN_TO" \
  https://tvoja-url.up.railway.app/api/statistiky
```

---

## 📊 API Endpointy

| Metóda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/health` | Kontrola stavu API |
| GET | `/api/faktury` | Zoznam všetkých faktúr |
| GET | `/api/faktury/:cislo` | Detail konkrétnej faktúry |
| POST | `/api/faktury` | Vytvorenie novej faktúry |
| PUT | `/api/faktury/:cislo` | Aktualizácia faktúry |
| PUT | `/api/faktury/:cislo/zaplatit` | Označenie ako zaplatené |
| DELETE | `/api/faktury/:cislo` | Odstránenie faktúry |
| GET | `/api/faktury/search` | Vyhľadávanie faktúr |
| GET | `/api/statistiky` | Štatistiky |

Detailnú dokumentáciu nájdeš v súbore `openapi.yaml`.

---

## 🛡️ Bezpečnosť

### API Key
- **Nikdy nezdieľaj** svoj `API_KEY`
- Používaj silný, náhodne generovaný kľúč
- Pri úniku okamžite zmeň kľúč v `.env` a Railway

### Google Credentials
- **Nikdy necommituj** `google-credentials.json` do gitu
- Súbor je automaticky ignorovaný cez `.gitignore`
- Pre production používaj `GOOGLE_CREDENTIALS_BASE64`

### Railway Environment Variables
- Všetky citlivé údaje ukladaj ako environment variables
- Nikdy ich nepíš priamo do kódu

---

## 🔧 Riešenie problémov

### API nefunguje lokálne

**Problém:** `Error: Google credentials not configured`
- **Riešenie:** Skontroluj, či existuje súbor `google-credentials.json` a či je nastavená cesta v `.env`

**Problém:** `401 Unauthorized`
- **Riešenie:** Skontroluj, či posielaš správny API Key v hlavičke `X-Faktury-API-Key`

**Problém:** `Permission denied` pri prístupe ku Sheets
- **Riešenie:** 
  1. Skontroluj, či je tabuľka zdieľaná so Service Account emailom
  2. Skontroluj, či má Service Account práva "Editor"
  3. Skontroluj, či je povolené Google Sheets API v Google Cloud projekte

### API nefunguje na Railway

**Problém:** `500 Internal Server Error`
- **Riešenie:** 
  1. Skontroluj Railway logs: `railway logs`
  2. Overeď, či je nastavená premenná `GOOGLE_CREDENTIALS_BASE64`
  3. Overeď, či je Base64 string správne zakódovaný (bez medzier a nových riadkov)

**Problém:** ChatGPT nedokáže zavolať API
- **Riešenie:**
  1. Skontroluj, či je URL v `openapi.yaml` správna
  2. Overeď, či je API Key v ChatGPT Actions správne nastavený
  3. Otestuj API manuálne cez curl

### Faktúry sa nevytvárajú

**Problém:** Faktúra sa nevytvára, hoci API vracia 200
- **Riešenie:**
  1. Skontroluj, či sheet v Google Sheets má názov `faktury` (malé písmená)
  2. Skontroluj, či prvý riadok obsahuje hlavičku
  3. Skontroluj Railway/konzolu logs na chybové hlášky

---

## 📝 Štruktúra projektu

```
sprava-faktur-adsun/
├── server.js              # Hlavný server
├── package.json           # Závislosti
├── openapi.yaml          # OpenAPI špecifikácia pre ChatGPT
├── env.example           # Príklad konfigurácie
├── .env                  # Lokálna konfigurácia (ignorovaná gitom)
├── .gitignore            # Ignorované súbory
├── google-credentials.json  # Google Service Account kľúč (ignorovaný gitom)
└── README.md             # Táto dokumentácia
```

---

## 🚀 Ďalšie rozšírenia (voliteľné)

### 1. PDF Export
- Integrácia s `puppeteer` alebo `pdfkit`
- Generovanie PDF faktúr s vlastným dizajnom

### 2. Email notifikácie
- Automatické odoslanie faktúry emailom po vytvorení
- Pripomienky pred splatnosťou
- Integrácia so SendGrid, Mailgun alebo SMTP

### 3. Položkový rozpis
- Rozšírenie o podrobný rozpis položiek faktúry
- Samostatný sheet "polozky" s položkami

### 4. Viacero firiem
- Podpora pre viacero firiem v jednom systéme
- Filter podľa firmy

### 5. Webhook notifikácie
- Automatické notifikácie do Slack/Discord pri novej faktúre

---

## 📄 Licencia

MIT License - voľne použiteľné na vlastné účely.

---

## 💡 Podpora

Ak máš problémy alebo otázky, skontroluj:
1. **Logs:** Railway Dashboard > Logs
2. **API dokumentáciu:** `openapi.yaml`
3. **Google Cloud Console:** Overeď Service Account a API permissions

---

**Vytvorené pomocou Claude Sonnet 4.5** 🤖

