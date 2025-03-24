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
export class OverviewCardsComponent {
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
    for (const item of this.overviewTickers) {
      this.alphaVantageService.getStockData(item.ticker).subscribe({
        next: (data) => {
          console.log(`${item.name}: ${data}`);
          item.data = data;
        },
        error: (error) => {
          console.error(`Error fetching data for ${item.name}: ${error}`);
        },
      });
    }
  }
}
