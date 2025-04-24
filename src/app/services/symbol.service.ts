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
  private symbolSource = new BehaviorSubject<string>('DOW');
  symbol$ = this.symbolSource.asObservable();

  private companyInfoSource = new BehaviorSubject<CompanyInfo | null>(null);
  companyInfo$ = this.companyInfoSource.asObservable();

  private companyInfoCache = new Map<string, CompanyInfo>();

  constructor(private alphaVantageService: AlphaVantageService) {
    this.loadCompanyInfo('DOW');
  }

  setSymbol(symbol: string) {
    this.symbolSource.next(symbol);
    this.loadCompanyInfo(symbol);
  }

  private loadCompanyInfo(symbol: string): void {
    if (this.companyInfoCache.has(symbol)) {
      this.companyInfoSource.next(this.companyInfoCache.get(symbol)!);
      return;
    }

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
          this.companyInfoCache.set(symbol, info);
        }),
        catchError((error) => {
          console.error('Error fetching company info:', error);
          return of({ symbol, name: symbol });
        })
      )
      .subscribe((info) => {
        this.companyInfoSource.next(info);
      });
  }

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
