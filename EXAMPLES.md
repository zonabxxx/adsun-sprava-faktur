# 🧪 Testovacie príklady API

Tento súbor obsahuje príklady volania API endpointov pre manuálne testovanie.

## Nastavenie

Nahraď tieto hodnoty svojimi:
```bash
export API_KEY="sk_faktury_secret_key_ZMEN_TO"
export BASE_URL="http://localhost:3000"
# Pre production: export BASE_URL="https://tvoja-url.up.railway.app"
```

---

## 1. Health Check

```bash
curl -i $BASE_URL/health
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "message": "Faktúry API beží",
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

---

## 2. GET - Všetky faktúry

```bash
curl -i \
  -H "X-Faktury-API-Key: $API_KEY" \
  $BASE_URL/api/faktury
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "data": [
    {
      "cislo": "2025001",
      "partner": "ADSUN, s.r.o.",
      "celkom_s_dph": 1200,
      ...
    }
  ],
  "count": 1
}
```

---

## 3. POST - Vytvorenie novej faktúry

### Základná faktúra

```bash
curl -i -X POST \
  -H "X-Faktury-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "partner": "ADSUN, s.r.o.",
    "ico": "12345678",
    "dic": "1234567890",
    "ulica": "Hlavná 123",
    "psc": "81101",
    "mesto": "Bratislava",
    "celkom_bez_dph": 1000,
    "celkom_s_dph": 1200,
    "zaklad_vyssia_sadzba": 1000,
    "suma_dph_vyssia": 200,
    "sadzba_dph_vyssia": 20,
    "datum_splatnosti": "2025-11-30",
    "vystavil": "GPT Agent",
    "interna_poznamka": "Testovacia faktúra"
  }' \
  $BASE_URL/api/faktury
```

### Faktúra s vlastným číslom

```bash
curl -i -X POST \
  -H "X-Faktury-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "cislo": "2025999",
    "partner": "Test, s.r.o.",
    "ico": "87654321",
    "celkom_bez_dph": 500,
    "celkom_s_dph": 600,
    "zaklad_vyssia_sadzba": 500,
    "suma_dph_vyssia": 100,
    "datum_splatnosti": "2025-12-15",
    "vystavil": "Admin"
  }' \
  $BASE_URL/api/faktury
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "message": "Faktúra vytvorená",
  "cislo": "2025001"
}
```

---

## 4. GET - Detail faktúry

```bash
curl -i \
  -H "X-Faktury-API-Key: $API_KEY" \
  $BASE_URL/api/faktury/2025001
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "data": {
    "cislo": "2025001",
    "typ": "Faktúra - vydaná",
    "datum_vystavenia": "2025-10-30",
    "partner": "ADSUN, s.r.o.",
    "ico": "12345678",
    "celkom_s_dph": 1200,
    "celkom_bez_dph": 1000,
    "zostava_uhradit": 1200,
    ...
  }
}
```

---

## 5. PUT - Aktualizácia faktúry

```bash
curl -i -X PUT \
  -H "X-Faktury-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "interna_poznamka": "Faktúra schválená - OK",
    "datum_splatnosti": "2025-12-01"
  }' \
  $BASE_URL/api/faktury/2025001
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "message": "Faktúra aktualizovaná",
  "cislo": "2025001"
}
```

---

## 6. PUT - Označenie ako zaplatené

```bash
curl -i -X PUT \
  -H "X-Faktury-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "datum_uhrady": "2025-10-30",
    "sposob_uhrady": "bankový prevod"
  }' \
  $BASE_URL/api/faktury/2025001/zaplatit
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "message": "Faktúra označená ako zaplatená",
  "cislo": "2025001",
  "datum_uhrady": "2025-10-30"
}
```

---

## 7. GET - Vyhľadávanie faktúr

### Všetky nezaplatené

```bash
curl -i \
  -H "X-Faktury-API-Key: $API_KEY" \
  "$BASE_URL/api/faktury/search?zaplatene=false"
```

### Podľa partnera

```bash
curl -i \
  -H "X-Faktury-API-Key: $API_KEY" \
  "$BASE_URL/api/faktury/search?partner=ADSUN"
```

### Kombinované filtre

```bash
curl -i \
  -H "X-Faktury-API-Key: $API_KEY" \
  "$BASE_URL/api/faktury/search?partner=ADSUN&zaplatene=false&datum_od=2025-01-01&datum_do=2025-12-31"
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "data": [
    {
      "cislo": "2025001",
      "partner": "ADSUN, s.r.o.",
      "celkom_s_dph": 1200,
      "zostava_uhradit": 1200
    }
  ],
  "count": 1
}
```

---

## 8. GET - Štatistiky

```bash
curl -i \
  -H "X-Faktury-API-Key: $API_KEY" \
  $BASE_URL/api/statistiky
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "data": {
    "celkovy_pocet": 5,
    "celkova_suma": 6000,
    "nezaplatene_pocet": 2,
    "nezaplatene_suma": 2400,
    "zaplatene_pocet": 3,
    "zaplatene_suma": 3600,
    "mena": "EUR"
  }
}
```

---

## 9. DELETE - Odstránenie faktúry

**⚠️ Pozor:** Toto trvalo odstráni faktúru!

```bash
curl -i -X DELETE \
  -H "X-Faktury-API-Key: $API_KEY" \
  $BASE_URL/api/faktury/2025999
```

**Očakávaný výstup:**
```json
{
  "status": "OK",
  "message": "Faktúra odstránená",
  "cislo": "2025999"
}
```

---

## 🔴 Testovanie chybových stavov

### 1. Neplatný API Key

```bash
curl -i \
  -H "X-Faktury-API-Key: invalid_key" \
  $BASE_URL/api/faktury
```

**Očakávaný výstup:** `401 Unauthorized`

### 2. Faktúra neexistuje

```bash
curl -i \
  -H "X-Faktury-API-Key: $API_KEY" \
  $BASE_URL/api/faktury/9999999
```

**Očakávaný výstup:** `404 Not Found`

### 3. Duplicitné číslo faktúry

```bash
# Vytvor faktúru s číslom 2025001
curl -X POST \
  -H "X-Faktury-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"cislo": "2025001", "partner": "Test", "celkom_s_dph": 100}' \
  $BASE_URL/api/faktury

# Skús vytvoriť znova s rovnakým číslom
curl -X POST \
  -H "X-Faktury-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"cislo": "2025001", "partner": "Test2", "celkom_s_dph": 200}' \
  $BASE_URL/api/faktury
```

**Očakávaný výstup:** `400 Bad Request` - "Faktúra s číslom ... už existuje"

---

## 📝 Automatizované testovanie

Pre kompletné testovanie môžeš vytvoriť skript:

**test-api.sh:**
```bash
#!/bin/bash

API_KEY="sk_faktury_secret_key_ZMEN_TO"
BASE_URL="http://localhost:3000"

echo "🧪 Test 1: Health check"
curl -s $BASE_URL/health | jq

echo "\n🧪 Test 2: Vytvorenie faktúry"
RESPONSE=$(curl -s -X POST \
  -H "X-Faktury-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "partner": "Test Client",
    "celkom_bez_dph": 1000,
    "celkom_s_dph": 1200,
    "zaklad_vyssia_sadzba": 1000,
    "suma_dph_vyssia": 200
  }' \
  $BASE_URL/api/faktury)

echo $RESPONSE | jq
FAKTURA_CISLO=$(echo $RESPONSE | jq -r '.cislo')

echo "\n🧪 Test 3: Detail faktúry"
curl -s -H "X-Faktury-API-Key: $API_KEY" \
  $BASE_URL/api/faktury/$FAKTURA_CISLO | jq

echo "\n🧪 Test 4: Označenie ako zaplatené"
curl -s -X PUT \
  -H "X-Faktury-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"sposob_uhrady": "bankový prevod"}' \
  $BASE_URL/api/faktury/$FAKTURA_CISLO/zaplatit | jq

echo "\n🧪 Test 5: Štatistiky"
curl -s -H "X-Faktury-API-Key: $API_KEY" \
  $BASE_URL/api/statistiky | jq

echo "\n✅ Všetky testy dokončené!"
```

Spusti:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔧 Použitie Postman/Insomnia

Ak preferuješ GUI nástroje:

1. Import OpenAPI spec (`openapi.yaml`) do Postman/Insomnia
2. Nastav environment variable `API_KEY`
3. Nastav base URL (`http://localhost:3000` alebo production URL)
4. Všetky endpointy budú automaticky pripravené

---

**Všetky príklady sú pripravené na kopírovanie a spustenie!** 🚀

