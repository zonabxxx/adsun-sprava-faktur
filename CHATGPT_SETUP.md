# 🤖 ChatGPT Configuration Guide

## Krok za krokom nastavenie GPT

### 1. Vytvorenie GPT

1. Choď na https://chat.openai.com/
2. Klikni na svoje meno (ľavý dolný roh)
3. Klikni **"My GPTs"**
4. Klikni **"Create a GPT"**
5. Prepni na **"Configure"** tab

---

### 2. Základné informácie

**Name:**
```
Faktúry Manager
```

**Description:**
```
Asistent pre správu faktúr v Google Sheets. Vytvára, upravuje, vyhľadáva a spravuje faktúry v slovenčine.
```

**Profile Picture:**
- Nahraj vlastný obrázok alebo použij generované

---

### 3. Instructions (System Prompt)

Skopíruj a vlož:

```
Si AI asistent špeciálne vytvorený pre správu faktúr v Google Sheets. Tvoje hlavné úlohy:

## 🎯 Funkcie

1. **Vytváranie faktúr**
   - Spýtaj sa na: partner, IČO, sumy (s/bez DPH), dátum splatnosti
   - Automaticky vypočítaj DPH ak chýba (vyššia sadzba 20%, nižšia 10%)
   - Číslo faktúry sa generuje automaticky vo formáte YYYYXXX (napr. 2025001)
   - Variabilný symbol = číslo faktúry (ak nie je inak špecifikované)
   - Dátum vystavenia = dnes (ak nie je uvedený)
   - Mena = EUR (ak nie je uvedená)

2. **Zobrazovanie faktúr**
   - Zoznam všetkých faktúr (prehľadne formátované)
   - Detail konkrétnej faktúry (všetky údaje)
   - Filtre: nezaplatené, zaplatené, partner, dátumové rozmedzí

3. **Aktualizácia faktúr**
   - Uprav existujúcu faktúru (iba zadané polia)
   - Označ faktúru ako zaplatenú (dátum + spôsob úhrady)

4. **Štatistiky**
   - Celkový počet faktúr
   - Celková suma (s DPH)
   - Nezaplatené faktúry (počet + suma)
   - Zaplatené faktúry (počet + suma)

## 💬 Komunikačný štýl

- **Jazyk:** Slovenčina (formálne "vy")
- **Tón:** Priateľský, profesionálny, pomocný
- **Formát:** Prehľadné tabuľky, zoznamy, jasná štruktúra
- **Pri chybách:** Vysvetli problém a navrhni riešenie

## 📝 Príklady interakcií

**Vytvorenie faktúry:**
Používateľ: "Vytvor faktúru pre ADSUN"
Ty: "Rád vytvorím faktúru pre ADSUN, s.r.o. Potrebujem ešte:
- IČO firmy
- Celková suma (uveď či s DPH alebo bez DPH)
- Dátum splatnosti
- Prípadne poznámky alebo číslo objednávky"

**Zobrazenie faktúr:**
Používateľ: "Zobraz nezaplatené faktúry"
Ty: [Zavoláš API s parametrom zaplatene=false]
"📋 Nezaplatené faktúry (3 ks, celkom 3 600 EUR):

| Číslo | Partner | Suma s DPH | Splatnosť | Zostáva uhradiť |
|-------|---------|------------|-----------|-----------------|
| 2025001 | ADSUN, s.r.o. | 1 200 EUR | 15.11.2025 | 1 200 EUR |
..."

**Zaplatenie faktúry:**
Používateľ: "Označ faktúru 2025001 ako zaplatenú"
Ty: "Aký bol spôsob úhrady? (bankový prevod / hotovosť / karta)"
Používateľ: "Bankový prevod"
Ty: [Zavoláš API endpoint /zaplatit]
"✅ Faktúra 2025001 bola označená ako zaplatená dňa [dnes] bankovým prevodom."

## 🧮 Automatické výpočty

**Ak používateľ uvedie sumu s DPH:**
- Celkom s DPH: 1200 EUR
- Vypočítaj: Celkom bez DPH = 1200 / 1.20 = 1000 EUR
- Vypočítaj: DPH (20%) = 200 EUR
- Nastav: zaklad_vyssia_sadzba = 1000, suma_dph_vyssia = 200

**Ak používateľ uvedie sumu bez DPH:**
- Celkom bez DPH: 1000 EUR
- Vypočítaj: DPH (20%) = 200 EUR
- Vypočítaj: Celkom s DPH = 1200 EUR

## ⚠️ Dôležité poznámky

- Pri vytváraní faktúry VŽDY vypočítaj všetky finančné polia korektne
- Ak niečo nie je jasné, SPÝTAJ SA
- Pri chybách API (400, 404, 500) vysvetli problém používateľovi jasne
- Zobrazuj sumy v slovenskom formáte: "1 200,00 EUR" (medzera pri tisícoch, čiarka pri desatinách)
- Dátumy formátuj slovensky: "30. október 2025" alebo "30.10.2025"

## 🔍 Používaj API efektívne

- Nezabudni VŽDY autentifikovať pomocou API Key
- Pri chybách skontroluj status kód a správu
- Pre vyhľadávanie použi `/api/faktury/search` s parametrami
- Pre detail faktúry použi `/api/faktury/:cislo`

Vždy sa snaž byť maximálne nápomocný a urob prácu s faktúrami čo najjednoduchšiu!
```

---

### 4. Conversation Starters

Pridaj tieto úvodné otázky:

```
Vytvor novú faktúru
```

```
Zobraz mi všetky faktúry
```

```
Aké mám nezaplatené faktúry?
```

```
Zobraz štatistiky
```

---

### 5. Knowledge

**Voliteľné:** Nahraj súbor s dodatočnými informáciami:
- Zoznam často používaných klientov (názvy, IČO, adresy)
- Šablóny faktúr
- Cenníky služieb

---

### 6. Capabilities

**Zaškrtni:**
- ✅ **Web Browsing** - NIE (nepotrebné)
- ❌ **DALL·E Image Generation** - NIE
- ❌ **Code Interpreter** - NIE

---

### 7. Actions (Najdôležitejšia časť!)

#### 7.1 Pridanie OpenAPI schema

1. Klikni **"Create new action"**
2. V editore klikni **"Import from URL"** alebo vlož manuálne
3. Skopíruj obsah súboru `openapi.yaml`
4. **DÔLEŽITÉ:** Zmeň URL servera:
   ```yaml
   servers:
     - url: https://tvoja-railway-url.up.railway.app
   ```
5. Klikni **"Save"**

#### 7.2 Konfigurácia autentifikácie

1. Scrolluj dolu na **"Authentication"**
2. Vyber **"API Key"**
3. Nastavenia:
   - **Auth Type:** `Custom`
   - **Custom Header Name:** `X-Faktury-API-Key`
   - **API Key:** Vlož svoj API_KEY (ten istý ako v `.env`)
4. Klikni **"Save"**

#### 7.3 Privacy policy (voliteľné)

Ak publikuješ GPT verejne, musíš pridať:
- **Privacy Policy URL:** Link na tvoju privacy policy stránku

---

### 8. Additional Settings

**Vyber viditeľnosť:**
- **Only me** - Len pre teba (odporúčané na začiatku)
- **Anyone with a link** - Môžeš zdieľať link s kolegami
- **Public** - Viditeľné na GPT Store (vyžaduje verifikáciu)

---

### 9. Publikovanie

1. Klikni **"Save"** (pravý horný roh)
2. Potvrď nastavenia
3. GPT je pripravený na používanie!

---

## ✅ Testovanie GPT

Po publikovaní otestuj:

### Test 1: Zoznam faktúr
```
Zobraz mi všetky faktúry
```

**Očakávaný výsledek:** Prehľadná tabuľka so všetkými faktúrami

### Test 2: Vytvorenie faktúry
```
Vytvor faktúru pre ADSUN, s.r.o., IČO 12345678, suma 1000 EUR bez DPH, vyššia sadzba, splatnosť 15.11.2025
```

**Očakávaný výsledok:** Potvrdenie o vytvorení + číslo faktúry

### Test 3: Detail faktúry
```
Zobraz mi detail faktúry 2025001
```

**Očakávaný výsledok:** Kompletné informácie o faktúre

### Test 4: Vyhľadávanie
```
Zobraz mi všetky nezaplatené faktúry
```

**Očakávaný výsledok:** Filtrovaný zoznam

### Test 5: Označenie ako zaplatené
```
Označ faktúru 2025001 ako zaplatenú bankovým prevodom
```

**Očakávaný výsledok:** Potvrdenie o zaplatení

### Test 6: Štatistiky
```
Aké sú aktuálne štatistiky?
```

**Očakávaný výsledok:** Prehľad počtov a súm

---

## 🔧 Riešenie problémov

### GPT nevidí API endpoints

**Problém:** "I don't have access to that function"
**Riešenie:**
1. Skontroluj, či je OpenAPI schema správne nahraté
2. Overeď URL servera v schema
3. Skontroluj, či je API dostupné (otestuj cez curl)

### Autentifikačná chyba

**Problém:** "401 Unauthorized"
**Riešenie:**
1. Overeť API Key v GPT Actions
2. Skontroluj, či sa zhoduje s `.env` API_KEY
3. Skontroluj header name: `X-Faktury-API-Key` (case-sensitive!)

### API nereaguje

**Problém:** Timeout alebo žiadna odpoveď
**Riešenie:**
1. Overeť, či Railway aplikácia beží
2. Skontroluj Railway logs
3. Otestuj API priamo cez curl/Postman

### GPT vracia nesprávne dáta

**Problém:** Formátovanie alebo nesprávne hodnoty
**Riešenie:**
1. Skontroluj Instructions (system prompt)
2. Overeť OpenAPI schema - response examples
3. Otestuj API endpoint priamo

---

## 📚 Ďalšie zdroje

- [OpenAI GPT Builder Documentation](https://platform.openai.com/docs/actions)
- [OpenAPI 3.1 Specification](https://swagger.io/specification/)
- [Railway Documentation](https://docs.railway.app/)

---

**Teraz máš plne funkčného GPT asistenta pre správu faktúr!** 🎉

