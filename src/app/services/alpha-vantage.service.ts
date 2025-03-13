import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment/dev';

@Injectable({
  providedIn: 'root',
})
export class AlphaVantageService {
  private apiKey = environment.alphaVantageApiKey;
  private baseUrl = 'https://www.alphavantage.co/query';

  private http = inject(HttpClient);

  getStockData(symbol: string): Observable<any> {
    const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`;
    return this.http.get<any>(url);
  }

  saveStockData(symbol: string, data: any): Observable<any> {
    return this.http.post<any>(
      `http://localhost:5000/api/AlphaVantage/${symbol}`,
      data
    );
  }
}
