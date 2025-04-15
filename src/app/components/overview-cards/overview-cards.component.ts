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
  // Start with ticker symbols only
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
    // Create an array of observables for getting company names
    const nameObservables = this.overviewTickers.map((ticker, index) =>
      this.symbolService
        .getCompanyName(ticker.ticker)
        .pipe(map((name) => ({ index, name })))
    );

    // Get all the names first
    forkJoin(nameObservables).subscribe({
      next: (results) => {
        // Update ticker names
        results.forEach((result) => {
          this.overviewTickers[result.index].name = result.name;
        });

        // Now fetch the latest data
        this.alphaVantageService.getLatestStockData().subscribe({
          next: (data) => {
            // Update each ticker with its corresponding data
            this.overviewTickers.forEach((ticker) => {
              if (data[ticker.ticker]) {
                ticker.data = {
                  price: data[ticker.ticker].close,
                  change: this.calculateDailyChange(data[ticker.ticker]),
                };
              } else {
                ticker.data = { price: 'No Data', change: 'No Data' };
              }
            });
          },
          error: (error) => {
            console.error(`Error fetching data from database: ${error}`);
          },
        });
      },
      error: (error) => {
        console.error(`Error fetching company names: ${error}`);
      },
    });
  }

  // Helper method to calculate percentage change
  private calculateDailyChange(stockData: any): string {
    if (!stockData || !stockData.open || !stockData.close) {
      return 'N/A';
    }

    const open = parseFloat(stockData.open);
    const close = parseFloat(stockData.close);
    const change = ((close - open) / open) * 100;

    return change.toFixed(2);
  }

  // set the selected symbol in the symbol service
  selectSymbol(ticker: string) {
    this.symbolService.setSymbol(ticker);
  }
}
