import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { WatchlistItem } from '../models/watchlist-item.model';
import { IndexedDbService } from './indexed-db.service';
import { catchError, switchMap, tap, map } from 'rxjs/operators';

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

  getStockData(symbol: string): Observable<any> {
    if (!this.isBrowser) {
      return of({});
    }

    return this.indexedDbService.getStockData(symbol).pipe(
      switchMap((cachedData) => {
        if (
          cachedData &&
          this.indexedDbService.isDataRecent(cachedData.lastUpdated)
        ) {
          console.log(`Using cached stock data for ${symbol}`);
          return of(cachedData.data);
        }

        console.log(`Fetching fresh stock data for ${symbol}`);
        return this.http
          .get<any>(`${this.apiUrl}${this.dashboardEndpoint}/fetch/${symbol}`)
          .pipe(
            tap((apiData) => {
              this.indexedDbService.saveStockData(symbol, apiData).subscribe();
            }),
            catchError((error) => {
              console.error('Error fetching stock data:', error);

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

  getStockDataFromDb(symbol: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.dashboardEndpoint}/${symbol}`
    );
  }

  getLatestStockData(): Observable<any> {
    const tickers = ['DOW', 'SPY', 'NDAQ', 'GLD', 'BTCUSD'];
    const result: { [key: string]: any } = {};

    if (!this.isBrowser) {
      return of(result);
    }

    const observables = tickers.map((ticker) =>
      this.getStockData(ticker).pipe(
        map((data) => ({ ticker, data })),
        catchError((error) => {
          console.error(`Error fetching data for ${ticker}:`, error);
          return of({ ticker, data: null });
        })
      )
    );

    return forkJoin(observables).pipe(
      map((results) => {
        const latestData: { [key: string]: any } = {};
        results.forEach((item) => {
          if (item.data && item.data.body) {
            const timestamps = Object.keys(item.data.body);
            if (timestamps.length > 0) {
              const latestTimestamp = timestamps[0];
              latestData[item.ticker] = {
                ...item.data.body[latestTimestamp],
                date: new Date(parseInt(latestTimestamp) * 1000)
                  .toISOString()
                  .split('T')[0],
              };
            }
          }
        });
        return latestData;
      })
    );
  }

  getWatchlist(): Observable<WatchlistItem[]> {
    if (!this.isBrowser) {
      return of([]);
    }

    return this.indexedDbService.getWatchlist();
  }

  addToWatchlist(item: WatchlistItem): Observable<any> {
    return this.indexedDbService.addToWatchlist(item).pipe(
      tap(() => {
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

  removeFromWatchlist(symbol: string): Observable<any> {
    return this.indexedDbService.removeFromWatchlist(symbol).pipe(
      tap(() => {
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

  getCompanyOverview(symbol: string): Observable<any> {
    if (!this.isBrowser) {
      return of({});
    }

    return this.indexedDbService.getCompanyOverview(symbol).pipe(
      switchMap((cachedData) => {
        if (
          cachedData &&
          this.indexedDbService.isDataRecent(cachedData.lastUpdated, 48)
        ) {
          console.log(`Using cached company overview for ${symbol}`);
          return of(cachedData.data);
        }

        console.log(`Fetching fresh company overview for ${symbol}`);
        return this.http
          .get<any>(
            `${this.apiUrl}${this.dashboardEndpoint}/company-overview/${symbol}`
          )
          .pipe(
            tap((apiData) => {
              this.indexedDbService
                .saveCompanyOverview(symbol, apiData)
                .subscribe();
            }),
            catchError((error) => {
              console.error('Error fetching company overview:', error);

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
