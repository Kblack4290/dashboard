import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment/dev';

@Injectable({
  providedIn: 'root',
})
export class AlphaVantageService {
  private apiKey = environment.alphaVantageApiKey; // API key from environment variables
  private baseUrl = 'https://www.alphavantage.co/query'; // Original API URL
  private apiUrl = 'http://localhost:5000/api/AlphaVantage'; // Backend API URL

  private http = inject(HttpClient);

  // Direct call to Alpha Vantage API
  getStockData(symbol: string): Observable<any> {
    const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`;
    return this.http.get<any>(url);
  }

  // Get data from PostgreSQL database
  getLatestStockData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/latest`);
  }

  // Get data for a specific symbol from database
  getStockDataFromDb(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${symbol}`);
  }

  // Save stock data to PostgreSQL database
  saveStockData(symbol: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${symbol}`, data);
  }
}
