import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WatchlistItem } from '../models/watchlist-item.model';

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'StockDashboardDB';
  private readonly DB_VERSION = 1;

  constructor() {
    this.initDb();
  }

  private initDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('watchlist')) {
          const watchlistStore = db.createObjectStore('watchlist', {
            keyPath: 'symbol',
          });
          watchlistStore.createIndex('symbol', 'symbol', { unique: true });
        }

        if (!db.objectStoreNames.contains('stockData')) {
          const stockDataStore = db.createObjectStore('stockData', {
            keyPath: 'id',
            autoIncrement: true,
          });
          stockDataStore.createIndex('symbol', 'symbol', { unique: false });
          stockDataStore.createIndex('symbolDate', ['symbol', 'date'], {
            unique: true,
          });
        }

        if (!db.objectStoreNames.contains('companyOverviews')) {
          const companyStore = db.createObjectStore('companyOverviews', {
            keyPath: 'symbol',
          });
          companyStore.createIndex('symbol', 'symbol', { unique: true });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error(
          'IndexedDB error:',
          (event.target as IDBOpenDBRequest).error
        );
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // Watchlist operations
  addToWatchlist(item: WatchlistItem): Observable<void> {
    return from(
      this.initDb().then((db) => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction('watchlist', 'readwrite');
          const store = transaction.objectStore('watchlist');

          item.dateAdded = new Date();
          const request = store.add(item);

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      })
    ).pipe(
      catchError((error) => {
        console.error('Error adding to watchlist:', error);
        throw error;
      })
    );
  }

  getWatchlist(): Observable<WatchlistItem[]> {
    return from(
      this.initDb().then((db) => {
        return new Promise<WatchlistItem[]>((resolve, reject) => {
          const transaction = db.transaction('watchlist', 'readonly');
          const store = transaction.objectStore('watchlist');
          const request = store.getAll();

          request.onsuccess = () => resolve(request.result as WatchlistItem[]);
          request.onerror = () => reject(request.error);
        });
      })
    ).pipe(
      catchError((error) => {
        console.error('Error getting watchlist:', error);
        return of([]);
      })
    );
  }

  removeFromWatchlist(symbol: string): Observable<void> {
    return from(
      this.initDb().then((db) => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction('watchlist', 'readwrite');
          const store = transaction.objectStore('watchlist');
          const request = store.delete(symbol);

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      })
    ).pipe(
      catchError((error) => {
        console.error('Error removing from watchlist:', error);
        throw error;
      })
    );
  }

  // Stock data operations
  saveStockData(symbol: string, data: any): Observable<void> {
    return from(
      this.initDb().then((db) => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction('stockData', 'readwrite');
          const store = transaction.objectStore('stockData');

          const stockEntry = {
            symbol,
            data,
            lastUpdated: new Date(),
          };

          // Check if we already have this data
          const index = store.index('symbol');
          const getRequest = index.getAll(symbol);

          getRequest.onsuccess = () => {
            // If we have data for this symbol, delete it first
            if (getRequest.result.length > 0) {
              getRequest.result.forEach((item) => {
                store.delete(item.id);
              });
            }

            // Now add the new data
            store.add(stockEntry);
          };

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      })
    ).pipe(
      catchError((error) => {
        console.error(`Error saving stock data for ${symbol}:`, error);
        throw error;
      })
    );
  }

  getStockData(symbol: string): Observable<any> {
    return from(
      this.initDb().then((db) => {
        return new Promise<any>((resolve, reject) => {
          const transaction = db.transaction('stockData', 'readonly');
          const store = transaction.objectStore('stockData');
          const index = store.index('symbol');
          const request = index.getAll(symbol);

          request.onsuccess = () => {
            if (request.result && request.result.length > 0) {
              // Get the most recent entry
              const sortedData = request.result.sort(
                (a, b) =>
                  new Date(b.lastUpdated).getTime() -
                  new Date(a.lastUpdated).getTime()
              );
              resolve(sortedData[0]);
            } else {
              resolve(null);
            }
          };
          request.onerror = () => reject(request.error);
        });
      })
    ).pipe(
      catchError((error) => {
        console.error(`Error getting stock data for ${symbol}:`, error);
        return of(null);
      })
    );
  }

  // Company overview operations
  saveCompanyOverview(symbol: string, data: any): Observable<void> {
    return from(
      this.initDb().then((db) => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction('companyOverviews', 'readwrite');
          const store = transaction.objectStore('companyOverviews');

          const overviewEntry = {
            symbol,
            data,
            lastUpdated: new Date(),
          };

          const request = store.put(overviewEntry); // Use put to update if exists

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      })
    ).pipe(
      catchError((error) => {
        console.error(`Error saving company overview for ${symbol}:`, error);
        throw error;
      })
    );
  }

  getCompanyOverview(symbol: string): Observable<any> {
    return from(
      this.initDb().then((db) => {
        return new Promise<any>((resolve, reject) => {
          const transaction = db.transaction('companyOverviews', 'readonly');
          const store = transaction.objectStore('companyOverviews');
          const request = store.get(symbol);

          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      })
    ).pipe(
      catchError((error) => {
        console.error(`Error getting company overview for ${symbol}:`, error);
        return of(null);
      })
    );
  }

  // Helper to check if data is recent enough to use
  isDataRecent(lastUpdated: Date | string, maxAgeHours: number = 24): boolean {
    const now = new Date();
    const updateTime = new Date(lastUpdated);
    const hoursSinceUpdate =
      (now.getTime() - updateTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < maxAgeHours;
  }
}
