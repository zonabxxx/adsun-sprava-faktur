require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-Faktury-API-Key']
}));
app.use(express.json());

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

// Google Sheets client
const getGoogleSheetsClient = async () => {
  let credentials;

  // Pre Railway deployment - použij base64 encoded credentials
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    const credString = Buffer.from(
      process.env.GOOGLE_CREDENTIALS_BASE64, 
      'base64'
    ).toString('utf8');
    credentials = JSON.parse(credString);
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client });
  }
  
  // Pre lokálny vývoj - použij súbor
  if (process.env.GOOGLE_CREDENTIALS_PATH) {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client });
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
      statistiky: '/api/statistiky'
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

// GET /api/faktury/search - Vyhľadávanie faktúr
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

// Spustenie servera
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Faktúry API beží na http://0.0.0.0:${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET    /health`);
  console.log(`   GET    /api/faktury`);
  console.log(`   GET    /api/faktury/:cislo`);
  console.log(`   POST   /api/faktury`);
  console.log(`   PUT    /api/faktury/:cislo`);
  console.log(`   PUT    /api/faktury/:cislo/zaplatit`);
  console.log(`   GET    /api/faktury/search`);
  console.log(`   GET    /api/statistiky`);
  console.log(`   DELETE /api/faktury/:cislo`);
  console.log(`\n🔑 API Key: ${process.env.API_KEY ? '✓ nastavený' : '✗ CHÝBA!'}`);
  console.log(`📄 Spreadsheet ID: ${process.env.SPREADSHEET_ID ? '✓ nastavený' : '✗ CHÝBA!'}`);
  console.log(`🔐 Google Credentials: ${process.env.GOOGLE_CREDENTIALS_PATH || process.env.GOOGLE_CREDENTIALS_BASE64 ? '✓ nastavené' : '✗ CHÝBAJÚ!'}\n`);
});

module.exports = app;

