import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment/dev';
import { WatchlistItem } from '../models/watchlist-item.model';

@Injectable({
  providedIn: 'root',
})
export class AlphaVantageService {
  private apiKey = environment.alphaVantageApiKey;
  private baseUrl = 'https://www.alphavantage.co/query';
  private apiUrl = 'http://localhost:5000/api/Dashboard';

  constructor(private http: HttpClient) {}

  // Fetch stock data through the backend
  getStockData(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fetch/${symbol}`);
  }

  // Get stock data directly from the database for a specific symbol
  getStockDataFromDb(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${symbol}`);
  }

  // Getting latest data for all tickers from the database
  getLatestStockData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/latest`);
  }

  // Save stock data to the database
  saveStockData(symbol: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${symbol}`, data);
  }

  // Get watchlist items
  getWatchlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/watchlist`);
  }

  // Add to watchlist
  addToWatchlist(item: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/watchlist`, item);
  }

  // Remove from watchlist
  removeFromWatchlist(symbol: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/watchlist/${symbol}`);
  }

  getCompanyOverview(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/company-overview/${symbol}`);
  }

  saveCompanyOverview(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/company-overview`, data);
  }
}
