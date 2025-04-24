import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { AlphaVantageService } from '../../services/alpha-vantage.service';
import { SymbolService } from '../../services/symbol.service';
import { switchMap, map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'overview-cards',
  templateUrl: './overview-cards.component.html',
  standalone: true,
  imports: [RouterModule, CommonModule],
  styleUrls: ['./overview-cards.component.css'],
})
export class OverviewCardsComponent implements OnInit {
  overviewTickers: { name: string; ticker: string; data?: any }[] = [
    { name: '', ticker: 'DOW' },
    { name: '', ticker: 'SPY' },
    { name: '', ticker: 'NDAQ' },
    { name: '', ticker: 'GLD' },
    { name: '', ticker: 'BTCUSD' },
  ];

  private alphaVantageService = inject(AlphaVantageService);
  private symbolService = inject(SymbolService);

  ngOnInit() {
    this.fetchOverviewData();
  }

  fetchOverviewData() {
    const nameObservables = this.overviewTickers.map((ticker, index) =>
      this.symbolService
        .getCompanyName(ticker.ticker)
        .pipe(map((name) => ({ index, name })))
    );

    forkJoin(nameObservables).subscribe({
      next: (results) => {
        results.forEach((result) => {
          this.overviewTickers[result.index].name = result.name;
        });

        this.alphaVantageService.getLatestStockData().subscribe({
          next: (data) => {
            console.log('Latest stock data:', data);

            if (!data) {
              console.error('No data returned from API');
              return;
            }

            this.overviewTickers.forEach((ticker) => {
              if (data[ticker.ticker]) {
                ticker.data = {
                  price:
                    data[ticker.ticker].close ||
                    data[ticker.ticker].price ||
                    'N/A',
                  change:
                    this.calculateDailyChange(data[ticker.ticker]) || 'N/A',
                };
              } else {
                ticker.data = { price: 0.0, change: 0.0 };
              }
            });
          },
          error: (error) => {
            console.error(`Error fetching data from database:`, error);
            this.overviewTickers.forEach((ticker) => {
              ticker.data = { price: 'Error', change: 'Error' };
            });
          },
        });
      },
      error: (error) => {
        console.error(`Error fetching company names:`, error);
      },
    });
  }

  private calculateDailyChange(stockData: any): string {
    if (!stockData || !stockData.open || !stockData.close) {
      return 'N/A';
    }

    const open = parseFloat(stockData.open);
    const close = parseFloat(stockData.close);
    const change = ((close - open) / open) * 100;

    return change.toFixed(2);
  }

  selectSymbol(ticker: string) {
    this.symbolService.setSymbol(ticker);
  }
}
