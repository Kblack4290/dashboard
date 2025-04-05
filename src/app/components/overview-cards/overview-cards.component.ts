import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { AlphaVantageService } from '../../services/alpha-vantage.service';

@Component({
  selector: 'overview-cards',
  templateUrl: './overview-cards.component.html',
  standalone: true,
  imports: [RouterModule, CommonModule],
  styleUrls: ['./overview-cards.component.css'],
})
export class OverviewCardsComponent implements OnInit {
  overviewTickers: { name: string; ticker: string; data?: any }[] = [
    { name: 'Dow Jones', ticker: 'DOW' },
    { name: 'S&P 500', ticker: 'SPY' },
    { name: 'NASDAQ', ticker: 'NDAQ' },
    { name: 'Gold', ticker: 'GLD' },
    { name: 'Bitcoin', ticker: 'BTCUSD' },
  ];

  private alphaVantageService = inject(AlphaVantageService);

  ngOnInit() {
    this.fetchOverviewData();
  }

  fetchOverviewData() {
    // Get latest data for all tickers from the database in a single API call
    this.alphaVantageService.getLatestStockData().subscribe({
      next: (data) => {
        console.log('Received data from database:', data);

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
}
