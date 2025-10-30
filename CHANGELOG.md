# 📜 CHANGELOG

Všetky významné zmeny v projekte.

---

## [1.0.0] - 2025-10-30

### ✨ Prvotné vydanie

#### Pridané
- ✅ Node.js Express API server
- ✅ Google Sheets API integrácia
- ✅ Autentifikácia pomocou API Key
- ✅ Podpora pre lokálny vývoj (credentials súbor)
- ✅ Podpora pre Railway deployment (Base64 credentials)

#### API Endpoints
- ✅ `GET /health` - Health check
- ✅ `GET /api/faktury` - Zoznam všetkých faktúr
- ✅ `GET /api/faktury/:cislo` - Detail faktúry
- ✅ `POST /api/faktury` - Vytvorenie novej faktúry
- ✅ `PUT /api/faktury/:cislo` - Aktualizácia faktúry
- ✅ `PUT /api/faktury/:cislo/zaplatit` - Označenie ako zaplatené
- ✅ `DELETE /api/faktury/:cislo` - Odstránenie faktúry
- ✅ `GET /api/faktury/search` - Vyhľadávanie faktúr
- ✅ `GET /api/statistiky` - Štatistiky

#### Funkcie
- ✅ Automatické generovanie čísla faktúry (YYYYXXX)
- ✅ Validácia duplicitných čísel faktúr
- ✅ Filtrovanie faktúr podľa:
  - Partner/klient (case-insensitive search)
  - Dátum vystavenia (od-do)
  - Stav úhrady (zaplatené/nezaplatené)
- ✅ Štatistiky:
  - Celkový počet faktúr
  - Celková suma
  - Nezaplatené (počet + suma)
  - Zaplatené (počet + suma)

#### Štruktúra dát
- ✅ Podpora pre 49 stĺpcov Google Sheets
- ✅ Kompletná slovenská faktúra s DPH
- ✅ Zálohy a čiastočné úhrady
- ✅ Viacero sadzieb DPH (vyššia, nižšia, nulová)

#### Dokumentácia
- ✅ `README.md` - Hlavná dokumentácia
- ✅ `GOOGLE_CLOUD_SETUP.md` - Google Cloud setup návod
- ✅ `DEPLOYMENT.md` - Deployment guide (Railway, Heroku, Render)
- ✅ `CHATGPT_SETUP.md` - ChatGPT konfigurácia
- ✅ `EXAMPLES.md` - Príklady API volaní
- ✅ `openapi.yaml` - OpenAPI 3.1 špecifikácia

#### Developer Experience
- ✅ `.env.example` - Príklad konfigurácie
- ✅ `.gitignore` - Ochrana citlivých údajov
- ✅ CORS podpora pre všetky origins
- ✅ JSON request/response
- ✅ Detailné error messages

---

## [Plánované]

### Verzia 1.1.0
- [ ] PDF export faktúr
- [ ] Email notifikácie
- [ ] Webhook podpora
- [ ] Rate limiting
- [ ] Request logging

### Verzia 1.2.0
- [ ] Viacero firiem v jednom systéme
- [ ] Položkový rozpis faktúr (samostatný sheet)
- [ ] Šablóny faktúr
- [ ] Automatické číslovanie podľa firmy

### Verzia 2.0.0
- [ ] Grafické rozhranie (React frontend)
- [ ] Používateľské účty a autentifikácia
- [ ] Role-based access control (RBAC)
- [ ] Audit log
- [ ] Backupy

---

## Formát

Formát changelogu je založený na [Keep a Changelog](https://keepachangelog.com/),
a projekt dodržiava [Semantic Versioning](https://semver.org/).

### Typy zmien
- **Pridané** (Added) - nové funkcie
- **Zmenené** (Changed) - zmeny v existujúcich funkciách
- **Zastarané** (Deprecated) - funkcie, ktoré budú odstránené
- **Odstránené** (Removed) - odstránené funkcie
- **Opravené** (Fixed) - opravy chýb
- **Bezpečnosť** (Security) - bezpečnostné záplaty

