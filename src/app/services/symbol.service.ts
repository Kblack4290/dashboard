import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AlphaVantageService } from './alpha-vantage.service';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

interface CompanyInfo {
  symbol: string;
  name: string;
  description?: string;
  sector?: string;
  industry?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SymbolService {
  private symbolSource = new BehaviorSubject<string>('DOW'); // Default symbol
  symbol$ = this.symbolSource.asObservable();

  // Add company info behavior subject
  private companyInfoSource = new BehaviorSubject<CompanyInfo | null>(null);
  companyInfo$ = this.companyInfoSource.asObservable();

  // Cache to avoid repeated API calls for the same symbol
  private companyInfoCache = new Map<string, CompanyInfo>();

  constructor(private alphaVantageService: AlphaVantageService) {
    // Load initial company info for default symbol
    this.loadCompanyInfo('DOW');
  }

  setSymbol(symbol: string) {
    this.symbolSource.next(symbol);
    this.loadCompanyInfo(symbol);
  }

  private loadCompanyInfo(symbol: string): void {
    // Check cache first
    if (this.companyInfoCache.has(symbol)) {
      this.companyInfoSource.next(this.companyInfoCache.get(symbol)!);
      return;
    }

    // Otherwise fetch from API
    this.alphaVantageService
      .getCompanyOverview(symbol)
      .pipe(
        map((response) => {
          const companyInfo: CompanyInfo = {
            symbol: symbol,
            name: response.Name || response.CompanyName || symbol,
            description: response.Description,
            sector: response.Sector,
            industry: response.Industry,
          };
          return companyInfo;
        }),
        tap((info) => {
          // Cache the result
          this.companyInfoCache.set(symbol, info);
        }),
        catchError((error) => {
          console.error('Error fetching company info:', error);
          // Return a basic object with just the symbol if API fails
          return of({ symbol, name: symbol });
        })
      )
      .subscribe((info) => {
        this.companyInfoSource.next(info);
      });
  }

  // Helper method to get company name for a symbol
  getCompanyName(symbol: string): Observable<string> {
    if (this.companyInfoCache.has(symbol)) {
      return of(this.companyInfoCache.get(symbol)!.name);
    }

    return this.alphaVantageService.getCompanyOverview(symbol).pipe(
      map((response) => response.Name || response.CompanyName || symbol),
      catchError(() => of(symbol))
    );
  }
}
