import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { WatchlistItem } from '../models/watchlist-item.model';
import { IndexedDbService } from './indexed-db.service';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AlphaVantageService {
  private apiUrl = environment.apiUrl;
  private dashboardEndpoint = '/api/Dashboard';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private indexedDbService: IndexedDbService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Fetch stock data with IndexedDB caching
  getStockData(symbol: string): Observable<any> {
    if (!this.isBrowser) {
      return of({});
    }

    // Try to get data from IndexedDB first
    return this.indexedDbService.getStockData(symbol).pipe(
      switchMap((cachedData) => {
        // If we have recent data in cache, use it
        if (
          cachedData &&
          this.indexedDbService.isDataRecent(cachedData.lastUpdated)
        ) {
          console.log(`Using cached stock data for ${symbol}`);
          return of(cachedData.data);
        }

        // Otherwise fetch from API and cache the result
        console.log(`Fetching fresh stock data for ${symbol}`);
        return this.http
          .get<any>(`${this.apiUrl}${this.dashboardEndpoint}/fetch/${symbol}`)
          .pipe(
            tap((apiData) => {
              // Cache the API result in IndexedDB
              this.indexedDbService.saveStockData(symbol, apiData).subscribe();
            }),
            catchError((error) => {
              console.error('Error fetching stock data:', error);

              // If we have any cached data, return it even if it's old
              if (cachedData) {
                console.log(
                  `Using stale cached data for ${symbol} due to API error`
                );
                return of(cachedData.data);
              }

              throw error;
            })
          );
      })
    );
  }

  // Get stock data directly from the database for a specific symbol
  getStockDataFromDb(symbol: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.dashboardEndpoint}/${symbol}`
    );
  }

  // Getting latest data for all tickers
  getLatestStockData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}${this.dashboardEndpoint}/latest`);
  }

  // Get watchlist items from IndexedDB
  getWatchlist(): Observable<WatchlistItem[]> {
    if (!this.isBrowser) {
      return of([]); // Return empty array during SSR
    }

    return this.indexedDbService.getWatchlist();
  }

  // Add to watchlist with IndexedDB
  addToWatchlist(item: WatchlistItem): Observable<any> {
    // Add to IndexedDB
    return this.indexedDbService.addToWatchlist(item).pipe(
      // Optionally, you can also add to API for backup/sync purposes
      tap(() => {
        // This is optional and can be removed if you don't want server-side storage
        this.http
          .post(`${this.apiUrl}${this.dashboardEndpoint}/watchlist`, item)
          .subscribe(
            () => console.log(`Item ${item.symbol} synced with server`),
            (err) =>
              console.warn(`Failed to sync ${item.symbol} with server:`, err)
          );
      })
    );
  }

  // Remove from watchlist with IndexedDB
  removeFromWatchlist(symbol: string): Observable<any> {
    // Remove from IndexedDB
    return this.indexedDbService.removeFromWatchlist(symbol).pipe(
      // Optionally, you can also remove from API for backup/sync purposes
      tap(() => {
        // This is optional and can be removed if you don't want server-side storage
        this.http
          .delete(`${this.apiUrl}${this.dashboardEndpoint}/watchlist/${symbol}`)
          .subscribe(
            () => console.log(`Item ${symbol} removed from server`),
            (err) =>
              console.warn(`Failed to remove ${symbol} from server:`, err)
          );
      })
    );
  }

  // Get company overview with IndexedDB caching
  getCompanyOverview(symbol: string): Observable<any> {
    if (!this.isBrowser) {
      return of({});
    }

    // Try to get data from IndexedDB first
    return this.indexedDbService.getCompanyOverview(symbol).pipe(
      switchMap((cachedData) => {
        // If we have recent data in cache, use it
        if (
          cachedData &&
          this.indexedDbService.isDataRecent(cachedData.lastUpdated, 48)
        ) {
          console.log(`Using cached company overview for ${symbol}`);
          return of(cachedData.data);
        }

        // Otherwise fetch from API and cache the result
        console.log(`Fetching fresh company overview for ${symbol}`);
        return this.http
          .get<any>(
            `${this.apiUrl}${this.dashboardEndpoint}/company-overview/${symbol}`
          )
          .pipe(
            tap((apiData) => {
              // Cache the API result in IndexedDB
              this.indexedDbService
                .saveCompanyOverview(symbol, apiData)
                .subscribe();
            }),
            catchError((error) => {
              console.error('Error fetching company overview:', error);

              // If we have any cached data, return it even if it's old
              if (cachedData) {
                console.log(
                  `Using stale cached company overview for ${symbol} due to API error`
                );
                return of(cachedData.data);
              }

              throw error;
            })
          );
      })
    );
  }
}
