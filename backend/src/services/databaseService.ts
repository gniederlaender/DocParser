import * as fs from 'fs';
import * as path from 'path';
import { ErrorCode } from '../types';
import { AppError } from '../middleware/errorHandler';

export interface LoanOfferRecord {
  id?: number;
  fileName: string;
  anbieter?: string;
  angebotsdatum?: string;
  nominale?: string;
  kreditbetrag?: string;
  laufzeit?: string;
  anzahlRaten?: string;
  sollzins?: string;
  fixzinssatz?: string;
  fixzinssatzBis?: string;
  fixzinssatz_in_jahren?: string;
  effektivzinssatz?: string;
  gebuehren?: string;
  monatsrate?: string;
  gesamtbetrag?: string;
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
        nominale TEXT,
        kreditbetrag TEXT,
        laufzeit TEXT,
        anzahlRaten TEXT,
        sollzins TEXT,
        fixzinssatz TEXT,
        fixzinssatzBis TEXT,
        fixzinssatz_in_jahren TEXT,
        effektivzinssatz TEXT,
        gebuehren TEXT,
        monatsrate TEXT,
        gesamtbetrag TEXT,
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

      const insertSql = `
        INSERT INTO loan_offers (
          fileName, anbieter, angebotsdatum, nominale, kreditbetrag, laufzeit,
          anzahlRaten, sollzins, fixzinssatz, fixzinssatzBis, fixzinssatz_in_jahren, effektivzinssatz, gebuehren,
          monatsrate, gesamtbetrag, rawJson, processingTime, confidence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const stmt = db.prepare(insertSql);
      let savedCount = 0;

      for (const offer of offers) {
        try {
          stmt.run(
            offer.fileName,
            offer.anbieter || null,
            offer.angebotsdatum || null,
            offer.nominale || null,
            offer.kreditbetrag || null,
            offer.laufzeit || null,
            offer.anzahlRaten || null,
            offer.sollzins || null,
            offer.fixzinssatz || null,
            offer.fixzinssatzBis || null,
            offer.fixzinssatz_in_jahren || null,
            offer.effektivzinssatz || null,
            offer.gebuehren || null,
            offer.monatsrate || null,
            offer.gesamtbetrag || null,
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
}

// Export singleton instance
export const databaseService = new DatabaseService();
