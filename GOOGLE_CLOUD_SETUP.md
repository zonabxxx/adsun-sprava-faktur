# 📋 Google Cloud Setup - Krok za krokom

Tento návod ťa prevedie nastavením Google Cloud projektu, Service Account a Google Sheets.

---

## 🌐 Krok 1: Vytvorenie Google Cloud projektu

### 1.1 Prihlásenie
1. Choď na: https://console.cloud.google.com/
2. Prihlás sa svojím Google účtom
3. Ak je to prvýkrát, akceptuj Terms of Service

### 1.2 Vytvorenie projektu
1. V hornej lište klikni na dropdown vedľa "Google Cloud"
2. Klikni **"NEW PROJECT"**
3. Vyplň:
   - **Project name:** `faktury-management`
   - **Location:** Nechaj "No organization" (alebo vyber svoju organizáciu)
4. Klikni **"CREATE"**
5. Počkaj cca 10-30 sekúnd na vytvorenie
6. V notifikácii klikni **"SELECT PROJECT"**

---

## 🔌 Krok 2: Povolenie Google Sheets API

### 2.1 Aktivácia API
1. V ľavom menu klikni **"APIs & Services" > "Library"**
2. V search bare napíš: `Google Sheets API`
3. Klikni na **"Google Sheets API"**
4. Klikni **"ENABLE"** (modrý gombík)
5. Počkaj pár sekúnd na aktiváciu

### 2.2 Overenie
Po aktivácii sa zobrazí Dashboard s informáciami o API.

---

## 🤖 Krok 3: Vytvorenie Service Account

Service Account je "robotický" účet, ktorý umožní tvojmu API pristupovať k Google Sheets bez ľudského prihlásenia.

### 3.1 Vytvorenie
1. V ľavom menu klikni **"IAM & Admin" > "Service Accounts"**
2. Klikni **"+ CREATE SERVICE ACCOUNT"** (hore)
3. **Service account details:**
   - **Service account name:** `faktury-bot`
   - **Service account ID:** automaticky sa doplní (napr. `faktury-bot`)
   - **Description:** `Service account pre Faktúry API` (voliteľné)
4. Klikni **"CREATE AND CONTINUE"**

### 3.2 Práva (Roles)
1. **Grant this service account access to project:**
   - Nechaj prázdne (nepotrebujeme žiadnu rolu)
2. Klikni **"CONTINUE"**

### 3.3 User access
1. **Grant users access to this service account:**
   - Nechaj prázdne (nepotrebujeme)
2. Klikni **"DONE"**

### 3.4 Výsledok
Mal by si vidieť nový Service Account v zozname:
- **Email:** `faktury-bot@faktury-management.iam.gserviceaccount.com`

**Dôležité:** Skopíruj tento email - budeš ho potrebovať neskôr!

---

## 🔑 Krok 4: Vytvorenie JSON kľúča (Credentials)

### 4.1 Generovanie kľúča
1. V zozname Service Accounts klikni na **`faktury-bot@...`**
2. Prejdi na záložku **"KEYS"** (hore)
3. Klikni **"ADD KEY" > "Create new key"**
4. Vyber formát: **JSON** (predvolené)
5. Klikni **"CREATE"**

### 4.2 Stiahnutie
- Automaticky sa stiahne súbor typu: `faktury-management-a1b2c3d4e5f6.json`
- **Dôležité:** Tento súbor je citlivý! Nikdy ho nezdieľaj a nenahraj na GitHub!

### 4.3 Premenuj súbor
Pre jednoduchosť premenuj súbor na:
```
google-credentials.json
```

### 4.4 Presun do projektu
Presuň súbor do zložky tvojho projektu:
```
sprava-faktur-adsun/
├── google-credentials.json  ← sem
├── server.js
├── package.json
└── ...
```

**Poznámka:** Súbor je automaticky ignorovaný v `.gitignore`, takže sa nedostane do git repozitára.

---

## 📊 Krok 5: Vytvorenie Google Sheets tabuľky

### 5.1 Nová tabuľka
1. Choď na: https://sheets.google.com/
2. Klikni **"Blank"** (prázdna tabuľka)
3. Vľavo hore premenuj na: **"Faktúry"**

### 5.2 Premenuj sheet
1. Dolu klikni pravým na **"Sheet1"**
2. Vyber **"Rename"**
3. Premenuj na: **`faktury`** (malé písmená!)

### 5.3 Pridanie hlavičky

Skopíruj tento riadok a vlož ho do bunky **A1**:

```
Číslo	Typ	Dátum vystavenia	Dátum dodania objednávky	Dátum dodania	Dátum splatnosti	Partner	Číslo partnera	Ulica	PSČ	Mesto	Kód krajiny	Krajina	IČO	DIČ	IČ DPH	Celkom s DPH	Celkom bez DPH	Základ - vyššia sadzba DPH	Základ - nižšia sadzba DPH 2	Základ - 0 sadzba DPH	Sadzba DPH vyššia	Sadzba DPH nižšia 2	Suma DPH - vyššia	Suma DPH - nižšia 2	Mena	Spôsob úhrady	Účet	IBAN	SWIFT	Variabilný symbol	Špecifický symbol	Konštantný symbol	Číslo objednávky	Firma	Vystavil	Uhradené zálohovou faktúrou	Uhradené zálohovou faktúrou bez DPH	Celkom bez uhradenej zálohy	Celkom bez uhradenej zálohy bez DPH	Zostáva uhradiť	Dátum úhrady	Číslo daň. dokladu k prijatej zálohe	Interná poznámka	Kategória	Podkategória	Číslo zákazky	Stredisko	Úvodný text
```

**Poznámka:** Stĺpce sa automaticky rozdelia od A po AW (49 stĺpcov).

### 5.4 Formátovanie (voliteľné)

Pre lepšiu prehľadnosť:
1. Označ prvý riadok (klikni na číslo "1")
2. **Bold** (Ctrl/Cmd + B)
3. **Pozadie:** Sivé alebo modré
4. **Freeze row:** View > Freeze > 1 row

---

## 🔐 Krok 6: Zdieľanie tabuľky so Service Account

**Toto je kľúčový krok!** Bez toho API nebude mať prístup k tabuľke.

### 6.1 Zdieľanie
1. V Google Sheets klikni **"Share"** (Zdieľať) - pravý horný roh
2. V poli "Add people or groups" vlož:
   ```
   faktury-bot@faktury-management.iam.gserviceaccount.com
   ```
   (Email z Kroku 3.4)
3. Práva: **Editor** (dôležité!)
4. **Odškrtni** checkbox "Notify people" (nepotrebujeme email notifikáciu)
5. Klikni **"Share"**

### 6.2 Overenie
V sekcii "People with access" by si mal vidieť:
- `faktury-bot@...` - Editor

---

## 🆔 Krok 7: Získanie Spreadsheet ID

### 7.1 Skopírovanie ID
Z URL Google Sheets tabuľky:

```
https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       toto je SPREADSHEET_ID
```

Skopíruj časť medzi `/d/` a `/edit`.

**Príklad:**
```
1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

### 7.2 Uloženie
Toto ID budeš potrebovať v `.env` súbore ako `SPREADSHEET_ID`.

---

## ✅ Kontrolný zoznam

Uisti sa, že máš:
- ✅ Google Cloud projekt vytvorený
- ✅ Google Sheets API povolené
- ✅ Service Account vytvorený
- ✅ JSON kľúč stiahnutý a premenovaný na `google-credentials.json`
- ✅ Google Sheets tabuľka vytvorená s názvom "Faktúry"
- ✅ Sheet premenovaný na "faktury" (malé písmená)
- ✅ Hlavička pridaná (49 stĺpcov)
- ✅ Tabuľka zdieľaná so Service Account emailom (práva: Editor)
- ✅ Spreadsheet ID skopírované

---

## 🧪 Test prístupu

Po dokončení všetkých krokov otestuj prístup:

### Test 1: Overenie credentials
Otvor `google-credentials.json` a skontroluj, či obsahuje:
```json
{
  "type": "service_account",
  "project_id": "faktury-management",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "faktury-bot@faktury-management.iam.gserviceaccount.com",
  ...
}
```

### Test 2: Overenie zdieľania
V Google Sheets klikni "Share" a skontroluj, či je Service Account v zozname.

### Test 3: API test
Po nastavení `.env` a spustení servera (`npm start`) testuj:
```bash
curl http://localhost:3000/health
```

Odpoveď:
```json
{"status":"OK","message":"Faktúry API beží","timestamp":"..."}
```

Ak všetko funguje, Google Cloud setup je hotový! 🎉

---

## 🔧 Riešenie problémov

### "Permission denied" pri prístupe k Sheets

**Príčina:** Tabuľka nie je zdieľaná so Service Account
**Riešenie:**
1. Skontroluj, či je Service Account email správne zadaný
2. Skontroluj práva (musí byť "Editor", nie "Viewer")
3. Počkaj 1-2 minúty (zmeny sa niekedy prejavia s miernym oneskorením)

### "Invalid credentials"

**Príčina:** Chybný alebo poškodený JSON súbor
**Riešenie:**
1. Overeď, že `google-credentials.json` je validný JSON (otvor v textovom editore)
2. Skontroluj, či cesta v `.env` je správna: `GOOGLE_CREDENTIALS_PATH=./google-credentials.json`
3. Vygeneruj nový kľúč (Krok 4)

### "API not enabled"

**Príčina:** Google Sheets API nie je povolené
**Riešenie:**
1. Choď na: APIs & Services > Library
2. Vyhľadaj "Google Sheets API"
3. Klikni "Enable"

### "Spreadsheet not found"

**Príčina:** Nesprávne Spreadsheet ID
**Riešenie:**
1. Skontroluj URL Google Sheets a skopíruj správne ID
2. Overeť, že ID v `.env` sa zhoduje

---

**Google Cloud setup je kompletný!** Teraz môžeš pokračovať na lokálne spustenie API. 🚀

