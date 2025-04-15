import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment/dev';
import { WatchlistItem } from '../models/watchlist-item.model';

@Injectable({
  providedIn: 'root',
})
export class AlphaVantageService {
  private apiUrl = environment.apiUrl;
  private dashboardEndpoint = '/api/Dashboard';
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  // Fetch stock data through the backend
  getStockData(symbol: string): Observable<any> {
    if (!this.isBrowser) {
      return of({});
    }
    return this.http.get<any>(
      `${this.apiUrl}${this.dashboardEndpoint}/fetch/${symbol}`
    );
  }

  // Get stock data directly from the database for a specific symbol
  getStockDataFromDb(symbol: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.dashboardEndpoint}/${symbol}`
    );
  }

  // Getting latest data for all tickers from the database
  getLatestStockData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}${this.dashboardEndpoint}/latest`);
  }

  // Save stock data to the database
  saveStockData(symbol: string, data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}${this.dashboardEndpoint}/${symbol}`,
      data
    );
  }

  // Get watchlist items
  getWatchlist(): Observable<any[]> {
    if (!this.isBrowser) {
      return of([]); // Return empty array during SSR
    }
    return this.http.get<any[]>(
      `${this.apiUrl}${this.dashboardEndpoint}/watchlist`
    );
  }

  // Add to watchlist
  addToWatchlist(item: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}${this.dashboardEndpoint}/watchlist`,
      item
    );
  }

  // Remove from watchlist
  removeFromWatchlist(symbol: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}${this.dashboardEndpoint}/watchlist/${symbol}`
    );
  }

  getCompanyOverview(symbol: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}${this.dashboardEndpoint}/company-overview/${symbol}`
    );
  }

  saveCompanyOverview(data: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}${this.dashboardEndpoint}/company-overview`,
      data
    );
  }
}
