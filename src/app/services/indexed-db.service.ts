import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import Dexie, { Transaction } from 'dexie';
import { WatchlistItem } from '../models/watchlist-item.model';

class StockDatabase extends Dexie {
  stockData!: Dexie.Table<
    {
      symbol: string;
      data: any;
      lastUpdated: Date;
    },
    string
  >;

  watchlist!: Dexie.Table<WatchlistItem, number>;

  companyOverviews!: Dexie.Table<
    {
      symbol: string;
      data: any;
      lastUpdated: Date;
    },
    string
  >;

  constructor() {
    super('StockDashboardDB');

    this.version(2)
      .stores({
        stockData: 'symbol',
        watchlist: '++id, symbol',
        companyOverviews: 'symbol',
      })
      .upgrade(function (transaction: Transaction) {
        console.log(`Upgrading database`);
      });
  }
}

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private db: StockDatabase | null = null;
  private readonly DB_NAME = 'StockDashboardDB';
  private readonly MAX_AGE_HOURS = 24;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser) {
      try {
        this.db = new StockDatabase();
        this.initializeDb();
      } catch (error) {
        console.error('Failed to create database:', error);
        this.db = null;
      }
    }
  }

  private initializeDb(): void {
    if (!this.db || !this.isBrowser) return;

    this.db.open().catch((error) => {
      console.error('Failed to open database:', error);
    });
  }

  isDataRecent(
    timestamp: Date,
    maxAgeHours: number = this.MAX_AGE_HOURS
  ): boolean {
    if (!timestamp) return false;

    const lastUpdated = new Date(timestamp);
    const now = new Date();
    const diffHours =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    return diffHours < maxAgeHours;
  }

  getStockData(
    symbol: string
  ): Observable<{ data: any; lastUpdated: Date } | null> {
    if (!this.isBrowser || !this.db) {
      console.log('IndexedDB not available in this environment');
      return of(null);
    }

    return from(this.db.stockData.get(symbol)).pipe(
      map((result) => result || null),
      catchError((error) => {
        console.error(`Error retrieving stock data for ${symbol}:`, error);
        return of(null);
      })
    );
  }

  saveStockData(symbol: string, data: any): Observable<void> {
    if (!this.isBrowser || !this.db) {
      return of(void 0);
    }

    const entry = {
      symbol,
      data,
      lastUpdated: new Date(),
    };

    return from(this.db.stockData.put(entry)).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error(`Error saving stock data for ${symbol}:`, error);
        return of(void 0);
      })
    );
  }

  getWatchlist(): Observable<WatchlistItem[]> {
    if (!this.isBrowser || !this.db) {
      return of([]);
    }

    return from(this.db.watchlist.toArray()).pipe(
      catchError((error) => {
        console.error('Error retrieving watchlist:', error);
        return of([]);
      })
    );
  }

  addToWatchlist(item: WatchlistItem): Observable<number> {
    if (!this.isBrowser || !this.db) {
      return of(-1);
    }

    return from(this.db.watchlist.put(item)).pipe(
      catchError((error) => {
        console.error(`Error adding ${item.symbol} to watchlist:`, error);
        throw error;
      })
    );
  }

  removeFromWatchlist(symbol: string): Observable<void> {
    if (!this.isBrowser || !this.db) {
      return of(void 0);
    }

    return from(this.db.watchlist.where('symbol').equals(symbol).delete()).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error(`Error removing ${symbol} from watchlist:`, error);
        throw error;
      })
    );
  }

  getCompanyOverview(
    symbol: string
  ): Observable<{ data: any; lastUpdated: Date } | null> {
    if (!this.isBrowser || !this.db) {
      return of(null);
    }

    return from(this.db.companyOverviews.get(symbol)).pipe(
      map((result) => result || null),
      catchError((error) => {
        console.error(
          `Error retrieving company overview for ${symbol}:`,
          error
        );
        return of(null);
      })
    );
  }

  saveCompanyOverview(symbol: string, data: any): Observable<void> {
    if (!this.isBrowser || !this.db) {
      return of(void 0);
    }

    const entry = {
      symbol,
      data,
      lastUpdated: new Date(),
    };

    return from(this.db.companyOverviews.put(entry)).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error(`Error saving company overview for ${symbol}:`, error);
        return of(void 0);
      })
    );
  }

  clearAllData(): Observable<void> {
    if (!this.isBrowser || !this.db) {
      return of(void 0);
    }

    return from(
      Promise.all([
        this.db.stockData.clear(),
        this.db.watchlist.clear(),
        this.db.companyOverviews.clear(),
      ])
    ).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error('Error clearing database:', error);
        return of(void 0);
      })
    );
  }
}
