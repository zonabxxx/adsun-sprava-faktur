require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Lazy loading - Google Sheets client sa vytvorí až keď je potrebný
let sheetsClientCache = null;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Faktury-API-Key']
}));
app.use(express.json());

// Request logger - aby sme videli čo Railway volá
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Autentifikácia
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-faktury-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ 
      status: 'ERROR', 
      message: 'Unauthorized - Invalid or missing API key' 
    });
  }
  next();
};

// Google Sheets client - LAZY LOADING pre rýchly štart
const getGoogleSheetsClient = async () => {
  // Použij cache ak už existuje
  if (sheetsClientCache) {
    return sheetsClientCache;
  }

  let credentials;

  // Pre Railway deployment - použij base64 encoded credentials
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    try {
      const credString = Buffer.from(
        process.env.GOOGLE_CREDENTIALS_BASE64, 
        'base64'
      ).toString('utf8');
      credentials = JSON.parse(credString);
      console.log('✅ Base64 credentials decoded successfully');
    } catch (error) {
      console.error('❌ Error decoding Base64 credentials:', error.message);
      throw new Error('Invalid GOOGLE_CREDENTIALS_BASE64');
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    sheetsClientCache = google.sheets({ version: 'v4', auth: client });
    return sheetsClientCache;
  }
  
  // Pre lokálny vývoj - použij súbor
  if (process.env.GOOGLE_CREDENTIALS_PATH) {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    sheetsClientCache = google.sheets({ version: 'v4', auth: client });
    return sheetsClientCache;
  }

  throw new Error('Google credentials not configured');
};

// Helper: Mapovanie stĺpcov podľa skutočnej štruktúry
const COLUMNS = {
  CISLO: 0,                          // A - Číslo
  TYP: 1,                            // B - Typ
  DATUM_VYSTAVENIA: 2,               // C - Dátum vystavenia
  DATUM_DODANIA_OBJEDNAVKY: 3,       // D - Dátum dodania objednávky
  DATUM_DODANIA: 4,                  // E - Dátum dodania
  DATUM_SPLATNOSTI: 5,               // F - Dátum splatnosti
  PARTNER: 6,                        // G - Partner
  CISLO_PARTNERA: 7,                 // H - Číslo partnera
  ULICA: 8,                          // I - Ulica
  PSC: 9,                            // J - PSČ
  MESTO: 10,                         // K - Mesto
  KOD_KRAJINY: 11,                   // L - Kód krajiny
  KRAJINA: 12,                       // M - Krajina
  ICO: 13,                           // N - IČO
  DIC: 14,                           // O - DIČ
  IC_DPH: 15,                        // P - IČ DPH
  CELKOM_S_DPH: 16,                  // Q - Celkom s DPH
  CELKOM_BEZ_DPH: 17,                // R - Celkom bez DPH
  ZAKLAD_VYSSIA_SADZBA: 18,          // S - Základ - vyššia sadzba DPH
  ZAKLAD_NIZSIA_SADZBA: 19,          // T - Základ - nižšia sadzba DPH 2
  ZAKLAD_NULA_SADZBA: 20,            // U - Základ - 0 sadzba DPH
  SADZBA_DPH_VYSSIA: 21,             // V - Sadzba DPH vyššia
  SADZBA_DPH_NIZSIA: 22,             // W - Sadzba DPH nižšia 2
  SUMA_DPH_VYSSIA: 23,               // X - Suma DPH - vyššia
  SUMA_DPH_NIZSIA: 24,               // Y - Suma DPH - nižšia 2
  MENA: 25,                          // Z - Mena
  SPOSOB_UHRADY: 26,                 // AA - Spôsob úhrady
  UCET: 27,                          // AB - Účet
  IBAN: 28,                          // AC - IBAN
  SWIFT: 29,                         // AD - SWIFT
  VARIABILNY_SYMBOL: 30,             // AE - Variabilný symbol
  SPECIFICKY_SYMBOL: 31,             // AF - Špecifický symbol
  KONSTANTNY_SYMBOL: 32,             // AG - Konštantný symbol
  CISLO_OBJEDNAVKY: 33,              // AH - Číslo objednávky
  FIRMA: 34,                         // AI - Firma
  VYSTAVIL: 35,                      // AJ - Vystavil
  UHRADENE_ZALOHOVOU: 36,            // AK - Uhradené zálohovou faktúrou
  UHRADENE_ZALOHOVOU_BEZ_DPH: 37,    // AL - Uhradené zálohovou faktúrou bez DPH
  CELKOM_BEZ_ZALOHY: 38,             // AM - Celkom bez uhradenej zálohy
  CELKOM_BEZ_ZALOHY_BEZ_DPH: 39,     // AN - Celkom bez uhradenej zálohy bez DPH
  ZOSTAVA_UHRADIT: 40,               // AO - Zostáva uhradiť
  DATUM_UHRADY: 41,                  // AP - Dátum úhrady
  CISLO_DAN_DOKLADU: 42,             // AQ - Číslo daň. dokladu k prijatej zálohe
  INTERNA_POZNAMKA: 43,              // AR - Interná poznámka
  KATEGORIA: 44,                     // AS - Kategória
  PODKATEGORIA: 45,                  // AT - Podkategória
  CISLO_ZAKAZKY: 46,                 // AU - Číslo zákazky
  STREDISKO: 47,                     // AV - Stredisko
  UVODNY_TEXT: 48                    // AW - Úvodný text
};

// Helper: Konverzia slovenského dátumu (DD.MM.YYYY) na ISO (YYYY-MM-DD)
const parseSlovakDate = (dateStr) => {
  if (!dateStr || dateStr === '') return null;
  
  // Ak už je v ISO formáte, vráť ako je
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Slovenský formát DD.MM.YYYY
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

// Helper: Konverzia riadku na objekt faktúry
const rowToFaktura = (row) => {
  return {
    cislo: row[COLUMNS.CISLO] || '',
    typ: row[COLUMNS.TYP] || '',
    datum_vystavenia: row[COLUMNS.DATUM_VYSTAVENIA] || '',
    datum_dodania_objednavky: row[COLUMNS.DATUM_DODANIA_OBJEDNAVKY] || '',
    datum_dodania: row[COLUMNS.DATUM_DODANIA] || '',
    datum_splatnosti: row[COLUMNS.DATUM_SPLATNOSTI] || '',
    partner: row[COLUMNS.PARTNER] || '',
    cislo_partnera: row[COLUMNS.CISLO_PARTNERA] || '',
    ulica: row[COLUMNS.ULICA] || '',
    psc: row[COLUMNS.PSC] || '',
    mesto: row[COLUMNS.MESTO] || '',
    kod_krajiny: row[COLUMNS.KOD_KRAJINY] || '',
    krajina: row[COLUMNS.KRAJINA] || '',
    ico: row[COLUMNS.ICO] || '',
    dic: row[COLUMNS.DIC] || '',
    ic_dph: row[COLUMNS.IC_DPH] || '',
    celkom_s_dph: parseFloat(row[COLUMNS.CELKOM_S_DPH]) || 0,
    celkom_bez_dph: parseFloat(row[COLUMNS.CELKOM_BEZ_DPH]) || 0,
    zaklad_vyssia_sadzba: parseFloat(row[COLUMNS.ZAKLAD_VYSSIA_SADZBA]) || 0,
    zaklad_nizsia_sadzba: parseFloat(row[COLUMNS.ZAKLAD_NIZSIA_SADZBA]) || 0,
    zaklad_nula_sadzba: parseFloat(row[COLUMNS.ZAKLAD_NULA_SADZBA]) || 0,
    sadzba_dph_vyssia: parseFloat(row[COLUMNS.SADZBA_DPH_VYSSIA]) || 20,
    sadzba_dph_nizsia: parseFloat(row[COLUMNS.SADZBA_DPH_NIZSIA]) || 10,
    suma_dph_vyssia: parseFloat(row[COLUMNS.SUMA_DPH_VYSSIA]) || 0,
    suma_dph_nizsia: parseFloat(row[COLUMNS.SUMA_DPH_NIZSIA]) || 0,
    mena: row[COLUMNS.MENA] || 'EUR',
    sposob_uhrady: row[COLUMNS.SPOSOB_UHRADY] || '',
    ucet: row[COLUMNS.UCET] || '',
    iban: row[COLUMNS.IBAN] || '',
    swift: row[COLUMNS.SWIFT] || '',
    variabilny_symbol: row[COLUMNS.VARIABILNY_SYMBOL] || '',
    specificky_symbol: row[COLUMNS.SPECIFICKY_SYMBOL] || '',
    konstantny_symbol: row[COLUMNS.KONSTANTNY_SYMBOL] || '',
    cislo_objednavky: row[COLUMNS.CISLO_OBJEDNAVKY] || '',
    firma: row[COLUMNS.FIRMA] || '',
    vystavil: row[COLUMNS.VYSTAVIL] || '',
    uhradene_zalohovou: parseFloat(row[COLUMNS.UHRADENE_ZALOHOVOU]) || 0,
    uhradene_zalohovou_bez_dph: parseFloat(row[COLUMNS.UHRADENE_ZALOHOVOU_BEZ_DPH]) || 0,
    celkom_bez_zalohy: parseFloat(row[COLUMNS.CELKOM_BEZ_ZALOHY]) || 0,
    celkom_bez_zalohy_bez_dph: parseFloat(row[COLUMNS.CELKOM_BEZ_ZALOHY_BEZ_DPH]) || 0,
    zostava_uhradit: parseFloat(row[COLUMNS.ZOSTAVA_UHRADIT]) || 0,
    datum_uhrady: row[COLUMNS.DATUM_UHRADY] || '',
    cislo_dan_dokladu: row[COLUMNS.CISLO_DAN_DOKLADU] || '',
    interna_poznamka: row[COLUMNS.INTERNA_POZNAMKA] || '',
    kategoria: row[COLUMNS.KATEGORIA] || '',
    podkategoria: row[COLUMNS.PODKATEGORIA] || '',
    cislo_zakazky: row[COLUMNS.CISLO_ZAKAZKY] || '',
    stredisko: row[COLUMNS.STREDISKO] || '',
    uvodny_text: row[COLUMNS.UVODNY_TEXT] || ''
  };
};

// Helper: Konverzia objektu faktúry na riadok
const fakturaToRow = (faktura) => {
  const row = new Array(49).fill('');
  
  row[COLUMNS.CISLO] = faktura.cislo || '';
  row[COLUMNS.TYP] = faktura.typ || 'Faktúra - vydaná';
  row[COLUMNS.DATUM_VYSTAVENIA] = faktura.datum_vystavenia || new Date().toISOString().split('T')[0];
  row[COLUMNS.DATUM_DODANIA_OBJEDNAVKY] = faktura.datum_dodania_objednavky || '';
  row[COLUMNS.DATUM_DODANIA] = faktura.datum_dodania || '';
  row[COLUMNS.DATUM_SPLATNOSTI] = faktura.datum_splatnosti || '';
  row[COLUMNS.PARTNER] = faktura.partner || '';
  row[COLUMNS.CISLO_PARTNERA] = faktura.cislo_partnera || '';
  row[COLUMNS.ULICA] = faktura.ulica || '';
  row[COLUMNS.PSC] = faktura.psc || '';
  row[COLUMNS.MESTO] = faktura.mesto || '';
  row[COLUMNS.KOD_KRAJINY] = faktura.kod_krajiny || 'SK';
  row[COLUMNS.KRAJINA] = faktura.krajina || 'Slovensko';
  row[COLUMNS.ICO] = faktura.ico || '';
  row[COLUMNS.DIC] = faktura.dic || '';
  row[COLUMNS.IC_DPH] = faktura.ic_dph || '';
  row[COLUMNS.CELKOM_S_DPH] = faktura.celkom_s_dph || 0;
  row[COLUMNS.CELKOM_BEZ_DPH] = faktura.celkom_bez_dph || 0;
  row[COLUMNS.ZAKLAD_VYSSIA_SADZBA] = faktura.zaklad_vyssia_sadzba || 0;
  row[COLUMNS.ZAKLAD_NIZSIA_SADZBA] = faktura.zaklad_nizsia_sadzba || 0;
  row[COLUMNS.ZAKLAD_NULA_SADZBA] = faktura.zaklad_nula_sadzba || 0;
  row[COLUMNS.SADZBA_DPH_VYSSIA] = faktura.sadzba_dph_vyssia || 20;
  row[COLUMNS.SADZBA_DPH_NIZSIA] = faktura.sadzba_dph_nizsia || 10;
  row[COLUMNS.SUMA_DPH_VYSSIA] = faktura.suma_dph_vyssia || 0;
  row[COLUMNS.SUMA_DPH_NIZSIA] = faktura.suma_dph_nizsia || 0;
  row[COLUMNS.MENA] = faktura.mena || 'EUR';
  row[COLUMNS.SPOSOB_UHRADY] = faktura.sposob_uhrady || '';
  row[COLUMNS.UCET] = faktura.ucet || '';
  row[COLUMNS.IBAN] = faktura.iban || '';
  row[COLUMNS.SWIFT] = faktura.swift || '';
  row[COLUMNS.VARIABILNY_SYMBOL] = faktura.variabilny_symbol || faktura.cislo || '';
  row[COLUMNS.SPECIFICKY_SYMBOL] = faktura.specificky_symbol || '';
  row[COLUMNS.KONSTANTNY_SYMBOL] = faktura.konstantny_symbol || '';
  row[COLUMNS.CISLO_OBJEDNAVKY] = faktura.cislo_objednavky || '';
  row[COLUMNS.FIRMA] = faktura.firma || '';
  row[COLUMNS.VYSTAVIL] = faktura.vystavil || '';
  row[COLUMNS.UHRADENE_ZALOHOVOU] = faktura.uhradene_zalohovou || 0;
  row[COLUMNS.UHRADENE_ZALOHOVOU_BEZ_DPH] = faktura.uhradene_zalohovou_bez_dph || 0;
  row[COLUMNS.CELKOM_BEZ_ZALOHY] = faktura.celkom_bez_zalohy || faktura.celkom_s_dph || 0;
  row[COLUMNS.CELKOM_BEZ_ZALOHY_BEZ_DPH] = faktura.celkom_bez_zalohy_bez_dph || faktura.celkom_bez_dph || 0;
  row[COLUMNS.ZOSTAVA_UHRADIT] = faktura.zostava_uhradit || faktura.celkom_s_dph || 0;
  row[COLUMNS.DATUM_UHRADY] = faktura.datum_uhrady || '';
  row[COLUMNS.CISLO_DAN_DOKLADU] = faktura.cislo_dan_dokladu || '';
  row[COLUMNS.INTERNA_POZNAMKA] = faktura.interna_poznamka || '';
  row[COLUMNS.KATEGORIA] = faktura.kategoria || '';
  row[COLUMNS.PODKATEGORIA] = faktura.podkategoria || '';
  row[COLUMNS.CISLO_ZAKAZKY] = faktura.cislo_zakazky || '';
  row[COLUMNS.STREDISKO] = faktura.stredisko || '';
  row[COLUMNS.UVODNY_TEXT] = faktura.uvodny_text || '';
  
  return row;
};

// Helper: Nájdi riadok podľa čísla faktúry
const findFakturaRow = async (sheets, spreadsheetId, cisloFaktury) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Data!A:A",
  });
  const rows = response.data.values;
  if (!rows) return null;
  
  const rowIndex = rows.findIndex((row, idx) => idx > 0 && row[0] === cisloFaktury);
  return rowIndex > 0 ? rowIndex + 1 : null;
};

// Helper: Generuj ďalšie číslo faktúry
const generateNextCisloFaktury = async (sheets, spreadsheetId) => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "Data!A:A",
  });
  
  const rows = response.data.values;
  if (!rows || rows.length <= 1) {
    return `${new Date().getFullYear()}001`;
  }
  
  // Nájdi najvyššie číslo faktúry
  const currentYear = new Date().getFullYear();
  let maxNumber = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const cislo = rows[i][0];
    if (cislo && cislo.startsWith(currentYear.toString())) {
      const number = parseInt(cislo.slice(4));
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  }
  
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${currentYear}${nextNumber}`;
};

// ===============================================
// API ENDPOINTS
// ===============================================

// Health check - musí byť rýchly pre Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Faktúry API beží',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Railway readiness probe
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Faktúry GPT API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      faktury: '/api/faktury',
      statistiky: '/api/statistiky',
      analytics: {
        firmy: '/api/analytics/firmy',
        splatnost: '/api/analytics/splatnost',
        obchodnici: '/api/analytics/obchodnici',
        mesacne: '/api/analytics/mesacne',
        top_klienti: '/api/analytics/top-klienti'
      }
    }
  });
});

// GET /api/faktury - Zoznam všetkých faktúr
app.get('/api/faktury', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:AW",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json({ status: 'OK', data: [], count: 0 });
    }

    const data = rows.slice(1)
      .filter(row => row[COLUMNS.CISLO]) // Filtrovať len riadky s číslom faktúry
      .map(row => rowToFaktura(row));

    res.json({ status: 'OK', data, count: data.length });
  } catch (error) {
    console.error('Error in GET /api/faktury:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// GET /api/faktury/search - Vyhľadávanie faktúr (MUSÍ BYŤ PRED /:cislo!)
app.get('/api/faktury/search', authenticateApiKey, async (req, res) => {
  try {
    const { partner, datum_od, datum_do, zaplatene } = req.query;
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:AW",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json({ status: 'OK', data: [], count: 0 });
    }

    let data = rows.slice(1)
      .filter(row => row[COLUMNS.CISLO])
      .map(row => rowToFaktura(row));

    // Filtrovanie
    if (partner) {
      data = data.filter(f => 
        f.partner.toLowerCase().includes(partner.toLowerCase())
      );
    }

    if (datum_od) {
      data = data.filter(f => f.datum_vystavenia >= datum_od);
    }

    if (datum_do) {
      data = data.filter(f => f.datum_vystavenia <= datum_do);
    }

    if (zaplatene !== undefined) {
      const jeZaplatene = zaplatene === 'true' || zaplatene === '1';
      data = data.filter(f => 
        jeZaplatene ? (f.datum_uhrady && f.zostava_uhradit === 0) : (!f.datum_uhrady || f.zostava_uhradit > 0)
      );
    }

    res.json({ status: 'OK', data, count: data.length });
  } catch (error) {
    console.error('Error in GET /api/faktury/search:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// GET /api/faktury/:cislo - Detail faktúry
app.get('/api/faktury/:cislo', authenticateApiKey, async (req, res) => {
  try {
    const cisloFaktury = req.params.cislo;
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const rowIndex = await findFakturaRow(sheets, spreadsheetId, cisloFaktury);
    if (!rowIndex) {
      return res.status(404).json({ 
        status: 'ERROR', 
        message: `Faktúra s číslom ${cisloFaktury} nebola nájdená` 
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Data!A${rowIndex}:AW${rowIndex}`,
    });

    const row = response.data.values?.[0];
    if (!row) {
      return res.status(404).json({ 
        status: 'ERROR', 
        message: 'Faktúra nebola nájdená' 
      });
    }

    const data = rowToFaktura(row);
    res.json({ status: 'OK', data });
  } catch (error) {
    console.error('Error in GET /api/faktury/:cislo:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// POST /api/faktury - Vytvorenie novej faktúry
app.post('/api/faktury', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    // Automaticky generuj číslo faktúry ak nie je zadané
    if (!req.body.cislo) {
      req.body.cislo = await generateNextCisloFaktury(sheets, spreadsheetId);
    }

    // Skontroluj, či faktúra s týmto číslom už existuje
    const existingRow = await findFakturaRow(sheets, spreadsheetId, req.body.cislo);
    if (existingRow) {
      return res.status(400).json({ 
        status: 'ERROR', 
        message: `Faktúra s číslom ${req.body.cislo} už existuje` 
      });
    }

    const rowData = fakturaToRow(req.body);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Data!A:AW",
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [rowData] }
    });

    res.json({ 
      status: 'OK', 
      message: 'Faktúra vytvorená',
      cislo: req.body.cislo 
    });
  } catch (error) {
    console.error('Error in POST /api/faktury:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// PUT /api/faktury/:cislo - Aktualizácia faktúry
app.put('/api/faktury/:cislo', authenticateApiKey, async (req, res) => {
  try {
    const cisloFaktury = req.params.cislo;
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const rowIndex = await findFakturaRow(sheets, spreadsheetId, cisloFaktury);
    if (!rowIndex) {
      return res.status(404).json({ 
        status: 'ERROR', 
        message: `Faktúra s číslom ${cisloFaktury} nebola nájdená` 
      });
    }

    // Načítaj existujúce dáta
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Data!A${rowIndex}:AW${rowIndex}`,
    });

    const existingRow = existingResponse.data.values?.[0] || [];
    const existingFaktura = rowToFaktura(existingRow);

    // Zlúč existujúce dáta s novými
    const updatedFaktura = { ...existingFaktura, ...req.body, cislo: cisloFaktury };
    const rowData = fakturaToRow(updatedFaktura);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Data!A${rowIndex}:AW${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: [rowData] }
    });

    res.json({ 
      status: 'OK', 
      message: 'Faktúra aktualizovaná',
      cislo: cisloFaktury 
    });
  } catch (error) {
    console.error('Error in PUT /api/faktury/:cislo:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// PUT /api/faktury/:cislo/zaplatit - Označiť faktúru ako zaplatenú
app.put('/api/faktury/:cislo/zaplatit', authenticateApiKey, async (req, res) => {
  try {
    const cisloFaktury = req.params.cislo;
    const { datum_uhrady, sposob_uhrady } = req.body;
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const rowIndex = await findFakturaRow(sheets, spreadsheetId, cisloFaktury);
    if (!rowIndex) {
      return res.status(404).json({ 
        status: 'ERROR', 
        message: `Faktúra s číslom ${cisloFaktury} nebola nájdená` 
      });
    }

    // Načítaj existujúcu faktúru
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Data!A${rowIndex}:AW${rowIndex}`,
    });

    const existingRow = existingResponse.data.values?.[0] || [];
    const existingFaktura = rowToFaktura(existingRow);

    // Aktualizuj údaje o úhrade
    existingFaktura.datum_uhrady = datum_uhrady || new Date().toISOString().split('T')[0];
    existingFaktura.sposob_uhrady = sposob_uhrady || 'bankový prevod';
    existingFaktura.zostava_uhradit = 0; // Nastaví sa na 0 keď je zaplatené

    const rowData = fakturaToRow(existingFaktura);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Data!A${rowIndex}:AW${rowIndex}`,
      valueInputOption: 'RAW',
      resource: { values: [rowData] }
    });

    res.json({ 
      status: 'OK', 
      message: 'Faktúra označená ako zaplatená',
      cislo: cisloFaktury,
      datum_uhrady: existingFaktura.datum_uhrady
    });
  } catch (error) {
    console.error('Error in PUT /api/faktury/:cislo/zaplatit:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// GET /api/statistiky - Štatistiky
app.get('/api/statistiky', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:AW",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json({ 
        status: 'OK', 
        data: {
          celkovy_pocet: 0,
          celkova_suma: 0,
          nezaplatene_pocet: 0,
          nezaplatene_suma: 0,
          zaplatene_pocet: 0,
          zaplatene_suma: 0
        }
      });
    }

    const faktury = rows.slice(1)
      .filter(row => row[COLUMNS.CISLO])
      .map(row => rowToFaktura(row));

    const celkovy_pocet = faktury.length;
    const celkova_suma = faktury.reduce((sum, f) => sum + f.celkom_s_dph, 0);

    const zaplatene = faktury.filter(f => f.datum_uhrady && f.zostava_uhradit === 0);
    const zaplatene_pocet = zaplatene.length;
    const zaplatene_suma = zaplatene.reduce((sum, f) => sum + f.celkom_s_dph, 0);

    const nezaplatene = faktury.filter(f => !f.datum_uhrady || f.zostava_uhradit > 0);
    const nezaplatene_pocet = nezaplatene.length;
    const nezaplatene_suma = nezaplatene.reduce((sum, f) => sum + f.zostava_uhradit, 0);

    res.json({
      status: 'OK',
      data: {
        celkovy_pocet,
        celkova_suma: Math.round(celkova_suma * 100) / 100,
        nezaplatene_pocet,
        nezaplatene_suma: Math.round(nezaplatene_suma * 100) / 100,
        zaplatene_pocet,
        zaplatene_suma: Math.round(zaplatene_suma * 100) / 100,
        mena: 'EUR'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/statistiky:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// DELETE /api/faktury/:cislo - Odstránenie faktúry
app.delete('/api/faktury/:cislo', authenticateApiKey, async (req, res) => {
  try {
    const cisloFaktury = req.params.cislo;
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const rowIndex = await findFakturaRow(sheets, spreadsheetId, cisloFaktury);
    if (!rowIndex) {
      return res.status(404).json({ 
        status: 'ERROR', 
        message: `Faktúra s číslom ${cisloFaktury} nebola nájdená` 
      });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0, // ID prvého sheetu (môže sa líšiť)
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex
            }
          }
        }]
      }
    });

    res.json({ 
      status: 'OK', 
      message: 'Faktúra odstránená',
      cislo: cisloFaktury 
    });
  } catch (error) {
    console.error('Error in DELETE /api/faktury/:cislo:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// ===============================================
// ROZŠÍRENÉ ANALYTICKÉ ENDPOINTY
// ===============================================

// GET /api/analytics/firmy - Obrat podľa partnerov/firiem
app.get('/api/analytics/firmy', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:AW",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json({ status: 'OK', data: [] });
    }

    const faktury = rows.slice(1)
      .filter(row => row[COLUMNS.CISLO])
      .map(row => rowToFaktura(row));

    // Zoskup podľa partnera
    const firmy = {};
    faktury.forEach(f => {
      const partner = f.partner || 'Nezadaný partner';
      if (!firmy[partner]) {
        firmy[partner] = {
          partner,
          ico: f.ico,
          pocet_faktur: 0,
          celkovy_obrat: 0,
          zaplatene_suma: 0,
          nezaplatene_suma: 0,
          priemernaFaktura: 0
        };
      }
      firmy[partner].pocet_faktur++;
      firmy[partner].celkovy_obrat += f.celkom_s_dph;
      
      if (f.datum_uhrady && f.zostava_uhradit === 0) {
        firmy[partner].zaplatene_suma += f.celkom_s_dph;
      } else {
        firmy[partner].nezaplatene_suma += f.zostava_uhradit;
      }
    });

    // Vypočítaj priemernú faktúru a zaokrúhli
    const data = Object.values(firmy).map(f => ({
      ...f,
      celkovy_obrat: Math.round(f.celkovy_obrat * 100) / 100,
      zaplatene_suma: Math.round(f.zaplatene_suma * 100) / 100,
      nezaplatene_suma: Math.round(f.nezaplatene_suma * 100) / 100,
      priemernaFaktura: Math.round((f.celkovy_obrat / f.pocet_faktur) * 100) / 100
    }));

    // Zoraď podľa obratu (zostupne)
    data.sort((a, b) => b.celkovy_obrat - a.celkovy_obrat);

    res.json({ 
      status: 'OK', 
      data,
      count: data.length,
      mena: 'EUR'
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/firmy:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// GET /api/analytics/splatnost - Analýza dodržiavania termínov splácania
app.get('/api/analytics/splatnost', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:AW",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json({ status: 'OK', data: {} });
    }

    const faktury = rows.slice(1)
      .filter(row => row[COLUMNS.CISLO])
      .map(row => rowToFaktura(row));

    // Filtrovať len zaplatené faktúry s dátumom úhrady
    const zaplatene = faktury.filter(f => f.datum_uhrady && f.datum_splatnosti);

    let vCas = 0;
    let neskoro = 0;
    let celkoveDniMeskania = 0;
    let nezaplatenePoTermine = 0;
    let nezaplatenePoTermineSuma = 0;

    const dnes = new Date();

    zaplatene.forEach(f => {
      const isoSplatnost = parseSlovakDate(f.datum_splatnosti);
      const isoUhrady = parseSlovakDate(f.datum_uhrady);
      
      if (!isoSplatnost || !isoUhrady) return;
      
      const datumSplatnosti = new Date(isoSplatnost);
      const datumUhrady = new Date(isoUhrady);
      
      if (datumUhrady <= datumSplatnosti) {
        vCas++;
      } else {
        neskoro++;
        const dniMeskania = Math.ceil((datumUhrady - datumSplatnosti) / (1000 * 60 * 60 * 24));
        celkoveDniMeskania += dniMeskania;
      }
    });

    // Nezaplatené po termíne
    const nezaplatene = faktury.filter(f => (!f.datum_uhrady || f.zostava_uhradit > 0) && f.datum_splatnosti);
    nezaplatene.forEach(f => {
      const isoSplatnost = parseSlovakDate(f.datum_splatnosti);
      if (!isoSplatnost) return;
      
      const datumSplatnosti = new Date(isoSplatnost);
      if (dnes > datumSplatnosti) {
        nezaplatenePoTermine++;
        nezaplatenePoTermineSuma += f.zostava_uhradit;
      }
    });

    const priemerneMeskanie = neskoro > 0 ? Math.round(celkoveDniMeskania / neskoro) : 0;
    const percentoVCas = zaplatene.length > 0 ? Math.round((vCas / zaplatene.length) * 100) : 0;

    res.json({
      status: 'OK',
      data: {
        zaplatene_celkom: zaplatene.length,
        zaplatene_v_cas: vCas,
        zaplatene_neskoro: neskoro,
        percento_v_cas: percentoVCas,
        priemerne_meskanie_dni: priemerneMeskanie,
        nezaplatene_po_termine: nezaplatenePoTermine,
        nezaplatene_po_termine_suma: Math.round(nezaplatenePoTermineSuma * 100) / 100,
        mena: 'EUR'
      }
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/splatnost:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// GET /api/analytics/obchodnici - Štatistiky podľa obchodníkov (kto vystavoval)
app.get('/api/analytics/obchodnici', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:AW",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json({ status: 'OK', data: [] });
    }

    const faktury = rows.slice(1)
      .filter(row => row[COLUMNS.CISLO])
      .map(row => rowToFaktura(row));

    // Zoskup podľa vystavovateľa
    const obchodnici = {};
    faktury.forEach(f => {
      const vystavil = f.vystavil || 'Nezadaný';
      if (!obchodnici[vystavil]) {
        obchodnici[vystavil] = {
          vystavil,
          pocet_faktur: 0,
          celkova_suma: 0,
          zaplatene_pocet: 0,
          zaplatene_suma: 0,
          nezaplatene_pocet: 0,
          nezaplatene_suma: 0,
          unikatni_klienti: new Set()
        };
      }
      obchodnici[vystavil].pocet_faktur++;
      obchodnici[vystavil].celkova_suma += f.celkom_s_dph;
      obchodnici[vystavil].unikatni_klienti.add(f.partner);
      
      if (f.datum_uhrady && f.zostava_uhradit === 0) {
        obchodnici[vystavil].zaplatene_pocet++;
        obchodnici[vystavil].zaplatene_suma += f.celkom_s_dph;
      } else {
        obchodnici[vystavil].nezaplatene_pocet++;
        obchodnici[vystavil].nezaplatene_suma += f.zostava_uhradit;
      }
    });

    // Konvertuj Set na počet a zaokrúhli
    const data = Object.values(obchodnici).map(o => ({
      vystavil: o.vystavil,
      pocet_faktur: o.pocet_faktur,
      celkova_suma: Math.round(o.celkova_suma * 100) / 100,
      zaplatene_pocet: o.zaplatene_pocet,
      zaplatene_suma: Math.round(o.zaplatene_suma * 100) / 100,
      nezaplatene_pocet: o.nezaplatene_pocet,
      nezaplatene_suma: Math.round(o.nezaplatene_suma * 100) / 100,
      pocet_klientov: o.unikatni_klienti.size,
      priemerna_faktura: Math.round((o.celkova_suma / o.pocet_faktur) * 100) / 100
    }));

    // Zoraď podľa celkovej sumy (zostupne)
    data.sort((a, b) => b.celkova_suma - a.celkova_suma);

    res.json({ 
      status: 'OK', 
      data,
      count: data.length,
      mena: 'EUR'
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/obchodnici:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// GET /api/analytics/mesacne - Mesačné štatistiky (trendová analýza)
app.get('/api/analytics/mesacne', authenticateApiKey, async (req, res) => {
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:AW",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json({ status: 'OK', data: [] });
    }

    const faktury = rows.slice(1)
      .filter(row => row[COLUMNS.CISLO])
      .map(row => rowToFaktura(row));

    // Zoskup podľa mesiaca (YYYY-MM)
    const mesacne = {};
    faktury.forEach(f => {
      if (!f.datum_vystavenia) return;
      
      // Konvertuj slovenský dátum na ISO formát
      const isoDate = parseSlovakDate(f.datum_vystavenia);
      if (!isoDate) return;
      
      const mesiac = isoDate.substring(0, 7); // YYYY-MM
      if (!mesacne[mesiac]) {
        mesacne[mesiac] = {
          mesiac,
          pocet_faktur: 0,
          celkova_suma: 0,
          zaplatene_pocet: 0,
          zaplatene_suma: 0,
          nezaplatene_pocet: 0,
          nezaplatene_suma: 0
        };
      }
      mesacne[mesiac].pocet_faktur++;
      mesacne[mesiac].celkova_suma += f.celkom_s_dph;
      
      if (f.datum_uhrady && f.zostava_uhradit === 0) {
        mesacne[mesiac].zaplatene_pocet++;
        mesacne[mesiac].zaplatene_suma += f.celkom_s_dph;
      } else {
        mesacne[mesiac].nezaplatene_pocet++;
        mesacne[mesiac].nezaplatene_suma += f.zostava_uhradit;
      }
    });

    // Zaokrúhli a zoraď podľa mesiaca
    const data = Object.values(mesacne)
      .map(m => ({
        ...m,
        celkova_suma: Math.round(m.celkova_suma * 100) / 100,
        zaplatene_suma: Math.round(m.zaplatene_suma * 100) / 100,
        nezaplatene_suma: Math.round(m.nezaplatene_suma * 100) / 100,
        priemerna_faktura: Math.round((m.celkova_suma / m.pocet_faktur) * 100) / 100
      }))
      .sort((a, b) => b.mesiac.localeCompare(a.mesiac)); // Zostupne (najnovší mesiac hore)

    res.json({ 
      status: 'OK', 
      data,
      count: data.length,
      mena: 'EUR'
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/mesacne:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// GET /api/analytics/top-klienti - Top klientov podľa obratu
app.get('/api/analytics/top-klienti', authenticateApiKey, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:AW",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.json({ status: 'OK', data: [] });
    }

    const faktury = rows.slice(1)
      .filter(row => row[COLUMNS.CISLO])
      .map(row => rowToFaktura(row));

    // Zoskup podľa partnera
    const klienti = {};
    faktury.forEach(f => {
      const partner = f.partner || 'Nezadaný partner';
      if (!klienti[partner]) {
        klienti[partner] = {
          partner,
          ico: f.ico,
          celkovy_obrat: 0,
          pocet_faktur: 0
        };
      }
      klienti[partner].celkovy_obrat += f.celkom_s_dph;
      klienti[partner].pocet_faktur++;
    });

    // Zoraď a vezmi top N
    const data = Object.values(klienti)
      .map(k => ({
        ...k,
        celkovy_obrat: Math.round(k.celkovy_obrat * 100) / 100,
        priemerna_faktura: Math.round((k.celkovy_obrat / k.pocet_faktur) * 100) / 100
      }))
      .sort((a, b) => b.celkovy_obrat - a.celkovy_obrat)
      .slice(0, limit);

    res.json({ 
      status: 'OK', 
      data,
      count: data.length,
      mena: 'EUR'
    });
  } catch (error) {
    console.error('Error in GET /api/analytics/top-klienti:', error);
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});

// ============================================
// FLOWII API INTEGRÁCIA
// ============================================

// Flowii API helper - získanie Access Token
let flowiiTokenCache = null;
let flowiiTokenExpiry = null;

const getFlowiiToken = async () => {
  // Použij cache ak token ešte platí (5 min pred expiráciou)
  if (flowiiTokenCache && flowiiTokenExpiry && Date.now() < flowiiTokenExpiry - 5 * 60 * 1000) {
    return flowiiTokenCache;
  }

  try {
    const response = await axios.post(
      `${process.env.FLOWII_API_URL}/token`,
      `grant_type=password&username=${encodeURIComponent(process.env.FLOWII_USERNAME)}&password=${encodeURIComponent(process.env.FLOWII_PASSWORD)}`,
      {
        headers: {
          'Api-Key': process.env.FLOWII_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    flowiiTokenCache = response.data.access_token;
    flowiiTokenExpiry = Date.now() + (response.data.expires_in * 1000);
    
    console.log('✅ Flowii Access Token získaný');
    return flowiiTokenCache;
  } catch (error) {
    console.error('❌ Chyba pri získavaní Flowii tokenu:', error.response?.data || error.message);
    throw new Error('Nepodarilo sa autentifikovať do Flowii API');
  }
};

// Získanie všetkých Orders z Flowii
const getFlowiiOrders = async (createdFrom = null) => {
  const token = await getFlowiiToken();
  const orders = [];
  let pageNumber = 0;
  let hasMore = true;

  try {
    while (hasMore) {
      let url = `${process.env.FLOWII_API_URL}/orders?companyId=${process.env.FLOWII_COMPANY_ID}&page[size]=100&page[number]=${pageNumber}`;
      
      // Filter pre orders vytvorené od určitého dátumu (unix timestamp)
      if (createdFrom) {
        const timestamp = Math.floor(new Date(createdFrom).getTime() / 1000);
        url += `&filter[created-from]=${timestamp}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Api-Key': process.env.FLOWII_API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        orders.push(...response.data.data);
        
        // Skontroluj či existuje ďalšia stránka
        hasMore = response.data.links && response.data.links.next;
        pageNumber++;
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Získaných ${orders.length} orders z Flowii`);
    return orders;
  } catch (error) {
    console.error('❌ Chyba pri získavaní orders z Flowii:', error.response?.data || error.message);
    throw new Error('Nepodarilo sa získať orders z Flowii');
  }
};

// Získanie dokumentov (faktúr) pre konkrétnu Order
const getFlowiiOrderDocuments = async (orderId) => {
  const token = await getFlowiiToken();

  try {
    const response = await axios.get(
      `${process.env.FLOWII_API_URL}/orders/${orderId}/documents?companyId=${process.env.FLOWII_COMPANY_ID}&page[size]=100`,
      {
        headers: {
          'Api-Key': process.env.FLOWII_API_KEY,
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Filtruj len faktúry (type = 4)
    const invoices = (response.data.data || []).filter(doc => doc.attributes.type === 4);
    return invoices;
  } catch (error) {
    console.error(`❌ Chyba pri získavaní dokumentov pre order ${orderId}:`, error.response?.data || error.message);
    return [];
  }
};

// Mapovanie Flowii faktúry na Google Sheets riadok
const mapFlowiiInvoiceToSheetRow = (invoice, partner, included) => {
  const attrs = invoice.attributes;
  
  // Vytvor prázdny riadok s 49 stĺpcami (A-AW)
  const row = new Array(49).fill('');
  
  // Základné údaje faktúry
  row[COLUMNS.CISLO] = attrs['serial-nr'] || '';
  row[COLUMNS.TYP] = 'Faktúra';
  row[COLUMNS.DATUM_VYSTAVENIA] = attrs['issued-date'] ? attrs['issued-date'].split('T')[0] : '';
  row[COLUMNS.DATUM_DODANIA] = attrs['delivery-date'] ? attrs['delivery-date'].split('T')[0] : '';
  row[COLUMNS.DATUM_SPLATNOSTI] = attrs['due-date'] ? attrs['due-date'].split('T')[0] : '';
  
  // Partner údaje (ak sú k dispozícii v included)
  if (partner) {
    row[COLUMNS.PARTNER] = partner.attributes.name || '';
    row[COLUMNS.ICO] = partner.attributes['registration-number'] || '';
    row[COLUMNS.DIC] = partner.attributes['tax-number'] || '';
    row[COLUMNS.IC_DPH] = partner.attributes['vat-number'] || '';
  }
  
  // Finančné údaje
  row[COLUMNS.CELKOM_BEZ_DPH] = attrs['gross-amount'] || 0;
  row[COLUMNS.CELKOM_S_DPH] = attrs['taxed-gross-amount'] || 0;
  row[COLUMNS.ZOSTAVA_UHRADIT] = attrs['unpaid'] || 0;
  
  // Stav faktúry
  if (attrs['invoice-state'] === 6 || attrs['unpaid'] === 0) {
    row[COLUMNS.DATUM_UHRADY] = attrs['paid-date'] ? attrs['paid-date'].split('T')[0] : '';
  }
  
  return row;
};

// POST /api/sync/flowii - Synchronizácia faktúr z Flowii do Google Sheets
app.post('/api/sync/flowii', authenticateApiKey, async (req, res) => {
  try {
    console.log('🔄 Spúšťam synchronizáciu faktúr z Flowii...');
    
    // Krok 1: Získaj poslednú faktúru z Google Sheets
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.SPREADSHEET_ID;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Data!A:C", // Len číslo, typ a dátum vystavenia
    });
    
    const rows = response.data.values;
    let lastInvoiceDate = null;
    
    if (rows && rows.length > 1) {
      // Nájdi najnovšiu faktúru
      for (let i = rows.length - 1; i >= 1; i--) {
        const row = rows[i];
        if (row[COLUMNS.CISLO] && row[COLUMNS.DATUM_VYSTAVENIA]) {
          lastInvoiceDate = row[COLUMNS.DATUM_VYSTAVENIA];
          console.log(`📅 Posledná faktúra v Sheets: ${row[COLUMNS.CISLO]} (${lastInvoiceDate})`);
          break;
        }
      }
    }
    
    // Krok 2: Získaj Orders z Flowii (od posledného dátumu)
    const orders = await getFlowiiOrders(lastInvoiceDate);
    
    if (orders.length === 0) {
      return res.json({
        status: 'OK',
        message: 'Žiadne nové orders na synchronizáciu',
        synchronized: 0
      });
    }
    
    // Krok 3: Pre každú Order získaj dokumenty (faktúry)
    const newInvoices = [];
    
    for (const order of orders) {
      const documents = await getFlowiiOrderDocuments(order.id);
      
      for (const doc of documents) {
        // Skontroluj či faktúra už existuje v Google Sheets
        const serialNr = doc.attributes['serial-nr'];
        const exists = rows && rows.some(row => row[COLUMNS.CISLO] === serialNr);
        
        if (!exists) {
          // Získaj partner data z included
          let partner = null;
          if (order.relationships && order.relationships.partner && order.relationships.partner.data) {
            const partnerId = order.relationships.partner.data.id;
            // V reálnom prípade by sme museli získať partnera z API alebo included
            // Pre jednoduchosť použijeme údaje z order
          }
          
          const sheetRow = mapFlowiiInvoiceToSheetRow(doc, partner, []);
          newInvoices.push(sheetRow);
          console.log(`✅ Nová faktúra: ${serialNr}`);
        }
      }
    }
    
    if (newInvoices.length === 0) {
      return res.json({
        status: 'OK',
        message: 'Všetky faktúry sú už v Google Sheets',
        synchronized: 0
      });
    }
    
    // Krok 4: Pridaj nové faktúry do Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Data!A:AW',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: newInvoices
      }
    });
    
    console.log(`✅ Synchronizácia dokončená: ${newInvoices.length} nových faktúr`);
    
    res.json({
      status: 'OK',
      message: `Synchronizácia úspešná`,
      synchronized: newInvoices.length,
      invoices: newInvoices.map(row => row[COLUMNS.CISLO])
    });
    
  } catch (error) {
    console.error('Error in POST /api/sync/flowii:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message,
      detail: error.response?.data || null
    });
  }
});

// Spustenie servera
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Faktúry API beží na http://0.0.0.0:${PORT}`);
  console.log(`📊 Základné Endpoints:`);
  console.log(`   GET    /health`);
  console.log(`   GET    /api/faktury`);
  console.log(`   GET    /api/faktury/:cislo`);
  console.log(`   POST   /api/faktury`);
  console.log(`   PUT    /api/faktury/:cislo`);
  console.log(`   PUT    /api/faktury/:cislo/zaplatit`);
  console.log(`   GET    /api/faktury/search`);
  console.log(`   GET    /api/statistiky`);
  console.log(`   DELETE /api/faktury/:cislo`);
  console.log(`\n📈 Analytické Endpoints:`);
  console.log(`   GET    /api/analytics/firmy`);
  console.log(`   GET    /api/analytics/splatnost`);
  console.log(`   GET    /api/analytics/obchodnici`);
  console.log(`   GET    /api/analytics/mesacne`);
  console.log(`   GET    /api/analytics/top-klienti`);
  console.log(`\n🔄 Synchronizácia:`);
  console.log(`   POST   /api/sync/flowii`);
  console.log(`\n🔑 API Key: ${process.env.API_KEY ? '✓ nastavený' : '✗ CHÝBA!'}`);
  console.log(`📄 Spreadsheet ID: ${process.env.SPREADSHEET_ID ? '✓ nastavený' : '✗ CHÝBA!'}`);
  console.log(`🔐 Google Credentials: ${process.env.GOOGLE_CREDENTIALS_PATH || process.env.GOOGLE_CREDENTIALS_BASE64 ? '✓ nastavené' : '✗ CHÝBAJÚ!'}`);
  console.log(`🌊 Flowii API: ${process.env.FLOWII_API_KEY && process.env.FLOWII_COMPANY_ID ? '✓ nastavené' : '✗ CHÝBA!'}\n`);
});

module.exports = app;

