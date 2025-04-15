import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment/prod';
import { WatchlistItem } from '../models/watchlist-item.model';

@Injectable({
  providedIn: 'root',
})
export class AlphaVantageService {
  private baseUrl = 'https://www.alphavantage.co/query';
  private apiUrl = environment.apiUrl || 'http://localhost:5000';
  private dashboardEndpoint = '/api/Dashboard';

  constructor(private http: HttpClient) {}

  // Fetch stock data through the backend
  getStockData(symbol: string): Observable<any> {
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
