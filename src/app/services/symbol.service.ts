import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SymbolService {
  private symbolSource = new BehaviorSubject<string>('DOW'); // Default symbol
  symbol$ = this.symbolSource.asObservable();

  setSymbol(symbol: string) {
    this.symbolSource.next(symbol);
  }
}
