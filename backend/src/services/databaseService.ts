import * as fs from 'fs';
import * as path from 'path';
import { ErrorCode } from '../types';
import { AppError } from '../middleware/errorHandler';

export interface LoanOfferRecord {
  id?: number;
  fileName: string;
  anbieter?: string;
  angebotsdatum?: string;
  
  // Kreditdaten
  kreditbetrag?: string;
  auszahlungsbetrag?: string;
  auszahlungsdatum?: string;
  datum1Rate?: string;
  laufzeit?: string;
  ratenanzahl?: string;
  kreditende?: string;
  sondertilgungen?: string;
  restwert?: string;
  
  // Zinskonditionen
  fixzinssatz?: string;
  fixzinsperiode?: string;
  fixzinssatz_in_jahren?: string;
  sollzinssatz?: string;
  effektivzinssatz?: string;
  
  // Einzelgebühren
  bearbeitungsgebuehr?: string;
  schaetzgebuehr?: string;
  kontofuehrungsgebuehr?: string;
  kreditpruefkosten?: string;
  vermittlerentgelt?: string;
  grundbucheintragungsgebuehr?: string;
  grundbuchseingabegebuehr?: string;
  grundbuchsauszug?: string;
  grundbuchsgesuch?: string;
  legalisierungsgebuehr?: string;
  
  // Gesamtkosten
  gesamtkosten?: string;
  gesamtbetrag?: string;
  
  // Zahlungen
  monatsrate?: string;
  
  rawJson: string;
  processingTime: number;
  confidence: number;
  createdAt?: string;
}

export class DatabaseService {
  private readonly dbPath: string;

  constructor() {
    // Use environment variable or default path
    this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../../austrian_banks_housing_loan.db');
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize database and create table if it doesn't exist
      this.createTableIfNotExists();
      console.log(`Database initialized at: ${this.dbPath}`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new AppError('Database initialization failed', ErrorCode.NETWORK_ERROR, 500);
    }
  }

  private createTableIfNotExists(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS loan_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileName TEXT NOT NULL,
        anbieter TEXT,
        angebotsdatum TEXT,
        
        -- Kreditdaten
        kreditbetrag TEXT,
        auszahlungsbetrag TEXT,
        auszahlungsdatum TEXT,
        datum1Rate TEXT,
        laufzeit TEXT,
        ratenanzahl TEXT,
        kreditende TEXT,
        sondertilgungen TEXT,
        restwert TEXT,
        
        -- Zinskonditionen
        fixzinssatz TEXT,
        fixzinsperiode TEXT,
        sollzinssatz TEXT,
        effektivzinssatz TEXT,
        
        -- Einzelgebühren
        bearbeitungsgebuehr TEXT,
        schaetzgebuehr TEXT,
        kontofuehrungsgebuehr TEXT,
        kreditpruefkosten TEXT,
        vermittlerentgelt TEXT,
        grundbucheintragungsgebuehr TEXT,
        grundbuchseingabegebuehr TEXT,
        grundbuchsauszug TEXT,
        grundbuchsgesuch TEXT,
        legalisierungsgebuehr TEXT,
        
        -- Gesamtkosten
        gesamtkosten TEXT,
        gesamtbetrag TEXT,
        
        -- Zahlungen
        monatsrate TEXT,
        
        rawJson TEXT NOT NULL,
        processingTime INTEGER NOT NULL,
        confidence REAL NOT NULL,
        createdAt TEXT DEFAULT (datetime('now'))
      )
    `;

    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);
      db.exec(sql);

      try {
        const columns = db.prepare(`PRAGMA table_info(loan_offers)`).all();
        const hasLaufzeitColumn = columns.some((column: { name: string }) => column.name === 'laufzeit');
        if (!hasLaufzeitColumn) {
          db.exec(`ALTER TABLE loan_offers ADD COLUMN laufzeit TEXT`);
        }
      } catch (alterError) {
        console.warn('Warning: Unable to ensure laufzeit column exists:', alterError);
      }

      db.close();
    } catch (error) {
      console.error('Failed to create table:', error);
      throw new AppError('Database table creation failed', ErrorCode.NETWORK_ERROR, 500);
    }
  }

  public async saveLoanOffers(offers: LoanOfferRecord[]): Promise<{ success: boolean; savedCount: number; error?: string }> {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);

      const columns = [
        'fileName', 'anbieter', 'angebotsdatum', 'kreditbetrag', 'auszahlungsbetrag', 'auszahlungsdatum', 'datum1Rate', 'laufzeit',
        'ratenanzahl', 'kreditende', 'sondertilgungen', 'restwert', 'fixzinssatz', 'fixzinsperiode', 'fixzinssatz_in_jahren', 'sollzinssatz',
        'effektivzinssatz', 'bearbeitungsgebuehr', 'schaetzgebuehr', 'kontofuehrungsgebuehr', 'kreditpruefkosten',
        'vermittlerentgelt', 'grundbucheintragungsgebuehr', 'grundbuchseingabegebuehr', 'grundbuchsauszug',
        'grundbuchsgesuch', 'legalisierungsgebuehr', 'gesamtkosten', 'gesamtbetrag', 'monatsrate', 'rawJson', 'processingTime', 'confidence'
      ];

      const placeholders = columns.map(() => '?').join(', ');
      const insertSql = `
        INSERT INTO loan_offers (${columns.join(', ')})
        VALUES (${placeholders})
      `;

      const stmt = db.prepare(insertSql);
      let savedCount = 0;

      for (const offer of offers) {
        try {
          stmt.run(
            offer.fileName,
            offer.anbieter || null,
            offer.angebotsdatum || null,
            offer.kreditbetrag || null,
            offer.auszahlungsbetrag || null,
            offer.auszahlungsdatum || null,
            offer.datum1Rate || null,
            offer.laufzeit || null,
            offer.ratenanzahl || null,
            offer.kreditende || null,
            offer.sondertilgungen || null,
            offer.restwert || null,
            offer.fixzinssatz || null,
            offer.fixzinsperiode || null,
            offer.fixzinssatz_in_jahren || null,
            offer.sollzinssatz || null,
            offer.effektivzinssatz || null,
            offer.bearbeitungsgebuehr || null,
            offer.schaetzgebuehr || null,
            offer.kontofuehrungsgebuehr || null,
            offer.kreditpruefkosten || null,
            offer.vermittlerentgelt || null,
            offer.grundbucheintragungsgebuehr || null,
            offer.grundbuchseingabegebuehr || null,
            offer.grundbuchsauszug || null,
            offer.grundbuchsgesuch || null,
            offer.legalisierungsgebuehr || null,
            offer.gesamtkosten || null,
            offer.gesamtbetrag || null,
            offer.monatsrate || null,
            offer.rawJson,
            offer.processingTime,
            offer.confidence
          );
          savedCount++;
        } catch (insertError) {
          console.error(`Failed to insert offer for file ${offer.fileName}:`, insertError);
          // Continue with other offers even if one fails
        }
      }

      db.close();
      return { success: true, savedCount };
    } catch (error) {
      console.error('Database save error:', error);
      return { 
        success: false, 
        savedCount: 0, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }

  public async getLoanOffers(limit: number = 100, offset: number = 0): Promise<LoanOfferRecord[]> {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);

      const selectSql = `
        SELECT * FROM loan_offers 
        ORDER BY createdAt DESC 
        LIMIT ? OFFSET ?
      `;

      const stmt = db.prepare(selectSql);
      const results = stmt.all(limit, offset);
      db.close();

      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw new AppError('Failed to retrieve loan offers', ErrorCode.NETWORK_ERROR, 500);
    }
  }

  public async getLoanOfferById(id: number): Promise<LoanOfferRecord | null> {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);

      const selectSql = `SELECT * FROM loan_offers WHERE id = ?`;
      const stmt = db.prepare(selectSql);
      const result = stmt.get(id);
      db.close();

      return result || null;
    } catch (error) {
      console.error('Database query error:', error);
      throw new AppError('Failed to retrieve loan offer', ErrorCode.NETWORK_ERROR, 500);
    }
  }

  public async getStats(): Promise<{ totalOffers: number; totalFiles: number }> {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);

      const countSql = `SELECT COUNT(*) as totalOffers FROM loan_offers`;
      const stmt = db.prepare(countSql);
      const result = stmt.get();
      db.close();

      return {
        totalOffers: result.totalOffers,
        totalFiles: result.totalOffers // Same for now, could be different if we track unique files
      };
    } catch (error) {
      console.error('Database stats error:', error);
      return { totalOffers: 0, totalFiles: 0 };
    }
  }

  public async updateLoanOffer(id: number, offer: Partial<LoanOfferRecord>): Promise<{ success: boolean; error?: string }> {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);

      // Build update query dynamically based on provided fields
      const updateFields: string[] = [];
      const values: any[] = [];

      // List of all updatable fields (excluding id, rawJson, processingTime, confidence, createdAt)
      const updatableFields = [
        'fileName', 'anbieter', 'angebotsdatum', 'kreditbetrag', 'auszahlungsbetrag', 
        'auszahlungsdatum', 'datum1Rate', 'laufzeit', 'ratenanzahl', 'kreditende', 
        'sondertilgungen', 'restwert', 'fixzinssatz', 'fixzinsperiode', 'fixzinssatz_in_jahren', 
        'sollzinssatz', 'effektivzinssatz', 'bearbeitungsgebuehr', 'schaetzgebuehr', 
        'kontofuehrungsgebuehr', 'kreditpruefkosten', 'vermittlerentgelt', 
        'grundbucheintragungsgebuehr', 'grundbuchseingabegebuehr', 'grundbuchsauszug', 
        'grundbuchsgesuch', 'legalisierungsgebuehr', 'gesamtkosten', 'gesamtbetrag', 'monatsrate'
      ];

      for (const field of updatableFields) {
        if (field in offer) {
          updateFields.push(`${field} = ?`);
          values.push(offer[field as keyof LoanOfferRecord] || null);
        }
      }

      // Update rawJson if any field was updated
      if (updateFields.length > 0) {
        // Get current record to merge with updates
        const currentRecord = await this.getLoanOfferById(id);
        if (!currentRecord) {
          db.close();
          return { success: false, error: 'Offer not found' };
        }

        // Merge updates with current record
        const updatedRecord = { ...currentRecord, ...offer };
        updateFields.push('rawJson = ?');
        values.push(JSON.stringify(updatedRecord));
      }

      if (updateFields.length === 0) {
        db.close();
        return { success: false, error: 'No fields to update' };
      }

      values.push(id);

      const updateSql = `
        UPDATE loan_offers 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      const stmt = db.prepare(updateSql);
      const result = stmt.run(...values);

      db.close();

      if (result.changes === 0) {
        return { success: false, error: 'No rows updated' };
      }

      return { success: true };
    } catch (error) {
      console.error('Database update error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }

  public async getAllLoanOffers(): Promise<LoanOfferRecord[]> {
    try {
      const Database = require('better-sqlite3');
      const db = new Database(this.dbPath);

      const selectSql = `SELECT * FROM loan_offers ORDER BY createdAt DESC`;
      const stmt = db.prepare(selectSql);
      const results = stmt.all();
      db.close();

      return results;
    } catch (error) {
      console.error('Database query error:', error);
      throw new AppError('Failed to retrieve loan offers', ErrorCode.NETWORK_ERROR, 500);
    }
  }
}

// Export singleton instance (lazy initialization)
let databaseServiceInstance: DatabaseService | null = null;

export const databaseService = {
  getInstance(): DatabaseService {
    if (!databaseServiceInstance) {
      databaseServiceInstance = new DatabaseService();
    }
    return databaseServiceInstance;
  }
};
