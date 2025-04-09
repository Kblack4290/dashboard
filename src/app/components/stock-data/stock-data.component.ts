import {
  Component,
  inject,
  OnInit,
  ViewChild,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlphaVantageService } from '../../services/alpha-vantage.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { SymbolService } from '../../services/symbol.service';
import { isPlatformBrowser } from '@angular/common';
import { WatchlistItem } from '../../models/watchlist-item.model';

@Component({
  selector: 'app-stock-data',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './stock-data.component.html',
  styleUrls: ['./stock-data.component.css'],
})
export class StockDataComponent implements OnInit {
  symbolInput = '';
  currentSymbol = 'DOW';
  loading = false;
  stockData: any[] = [];
  stockInfo: any = {};
  successMessage = '';
  errorMessage = '';
  isBrowser: boolean;
  isInWatchlist = false;

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  private alphaVantageService = inject(AlphaVantageService);
  private symbolService = inject(SymbolService);

  chartData: ChartData = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Stock Price',
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Stock Price History',
      },
      legend: {
        display: true,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    this.symbolService.symbol$.subscribe((symbol) => {
      this.currentSymbol = symbol;
      this.symbolInput = symbol;
      this.loadStockData(symbol);
      this.checkWatchlist(symbol);
    });

    this.loadStockData(this.currentSymbol);
    this.checkWatchlist(this.currentSymbol);
  }

  loadStockData(symbol: string) {
    this.loading = true;
    this.alphaVantageService.getStockData(symbol).subscribe({
      next: (data) => {
        if (!data || !Array.isArray(data)) {
          this.errorMessage = 'Invalid data format received from the server.';
          this.loading = false;
          return;
        }

        this.stockData = data.slice(0, 7);
        this.updateChart();
        this.updateStockInfo();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load stock data.';
        console.error(`Error loading data for ${symbol}: ${err.message}`);
        this.loading = false;
      },
    });
  }

  updateChart() {
    if (this.stockData.length === 0) {
      console.warn('No stock data available to update the chart.');
      return;
    }

    const dates = this.stockData.map((day) => day.date).reverse();
    const prices = this.stockData.map((day) => parseFloat(day.close)).reverse();

    this.chartData = {
      labels: dates,
      datasets: [
        {
          data: prices,
          label: `${this.currentSymbol} Price`,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true,
        },
      ],
    };

    if (
      this.chartOptions &&
      this.chartOptions.plugins &&
      this.chartOptions.plugins.title
    ) {
      this.chartOptions.plugins.title.text = `${this.currentSymbol} - Last 7 Days`;
    }

    if (this.chart) {
      this.chart.update();
    }
  }

  updateStockInfo() {
    if (this.stockData.length === 0) {
      console.warn('No stock data available to update stock info.');
      this.stockInfo = null;
      return;
    }

    if (!this.stockInfo) {
      this.errorMessage =
        'Stock information is still loading. Please try again later.';
      return;
    }

    const latestData = this.stockData[0];
    const previousData = this.stockData.length > 1 ? this.stockData[1] : null;

    this.stockInfo = {
      symbol: this.currentSymbol,
      latestPrice: latestData.close,
      latestDate: latestData.date,
      previousClose: previousData ? previousData.close : 'N/A',
      high: latestData.high,
      low: latestData.low,
      volume: latestData.volume,
      change: this.calculateChange(
        latestData.close,
        previousData ? previousData.close : latestData.open
      ),
    };
  }

  calculateChange(current: string, previous: string): string {
    const currentValue = parseFloat(current);
    const previousValue = parseFloat(previous);

    if (isNaN(currentValue) || isNaN(previousValue) || previousValue === 0) {
      return 'N/A';
    }

    const change = ((currentValue - previousValue) / previousValue) * 100;
    return change.toFixed(2);
  }

  // Search for stock data
  fetchAndSaveStockData() {
    if (!this.symbolInput) {
      this.errorMessage = 'Please enter a stock symbol';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Update current symbol
    this.currentSymbol = this.symbolInput.toUpperCase();

    // Fetch stock data through the backend
    this.alphaVantageService.getStockData(this.symbolInput).subscribe({
      next: (data) => {
        this.alphaVantageService
          .saveStockData(this.symbolInput, data)
          .subscribe({
            next: () => {
              this.successMessage = 'Data saved successfully';
              this.loading = false;

              // Load data to display chart and info
              this.loadStockData(this.symbolInput);
            },
            error: (err) => {
              this.errorMessage = `Failed to save data: ${err.message}`;
              this.loading = false;
            },
          });
      },
      error: (err) => {
        this.errorMessage = `Failed to fetch data: ${err.message}`;
        this.loading = false;
      },
    });
  }

  checkWatchlist(symbol: string) {
    this.alphaVantageService
      .getWatchlist()
      .subscribe((watchlist: WatchlistItem[]) => {
        this.isInWatchlist = watchlist.some(
          (item: WatchlistItem) => item.symbol === symbol
        );
      });
  }

  toggleWatchlist() {
    if (!this.stockInfo) {
      this.errorMessage = 'Stock information is not available.';
      return;
    }

    if (this.isInWatchlist) {
      this.alphaVantageService
        .removeFromWatchlist(this.currentSymbol)
        .subscribe(() => {
          this.isInWatchlist = false;
          this.successMessage = `${this.currentSymbol} removed from watchlist.`;
        });
    } else {
      const watchlistItem: WatchlistItem = {
        id: 0,
        symbol: this.currentSymbol,
        name: this.stockInfo.symbol || 'Unknown',
        latestPrice: this.stockInfo.latestPrice || '0.00',
        previousClose: this.stockInfo.previousClose || '0.00',
        dayRange: `${this.stockInfo.low || '0.00'} - ${
          this.stockInfo.high || '0.00'
        }`,
        volume: this.stockInfo.volume || '0',
        changePercentage: this.stockInfo.change || '0.00',
        dateAdded: new Date(),
      };

      this.alphaVantageService.addToWatchlist(watchlistItem).subscribe(() => {
        this.isInWatchlist = true;
        this.successMessage = `${this.currentSymbol} added to watchlist.`;
      });
    }
  }
}
