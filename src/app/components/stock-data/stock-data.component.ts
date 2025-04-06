import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlphaVantageService } from '../../services/alpha-vantage.service';
import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-stock-data',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './stock-data.component.html',
  styleUrls: ['./stock-data.component.css'],
})
export class StockDataComponent implements OnInit {
  // Input and status fields
  symbolInput = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  // Current displayed symbol
  currentSymbol = 'DOW';

  // Stock data
  stockData: any[] = [];
  stockInfo: any = {
    symbol: 'DOW',
    latestPrice: 'Loading...',
    latestDate: 'Loading...',
    previousClose: 'Loading...',
    high: 'Loading...',
    low: 'Loading...',
    volume: 'Loading...',
  };

  // Chart properties
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  chartData: ChartData = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Stock Price',
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
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

  // Service injections
  private alphaVantageService = inject(AlphaVantageService);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // Check route params for symbol
    this.route.queryParams.subscribe((params) => {
      if (params['symbol']) {
        this.currentSymbol = params['symbol'];
        this.symbolInput = params['symbol'];
      }

      // Load data for the current symbol
      this.loadStockData(this.currentSymbol);
    });
  }

  // Load stock data from API
  loadStockData(symbol: string) {
    this.loading = true;
    this.errorMessage = '';

    this.alphaVantageService.getStockDataFromDb(symbol).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          // Get the last 7 days of data
          this.stockData = data.slice(0, 7);

          // Update chart with data
          this.updateChart();

          // Update stock info section
          this.updateStockInfo();

          this.loading = false;
        } else {
          this.errorMessage = `No data found for ${symbol}`;
          this.loading = false;
        }
      },
      error: (err) => {
        this.errorMessage = `Error loading data for ${symbol}: ${err.message}`;
        this.loading = false;
      },
    });
  }

  // Update chart with stock data
  updateChart() {
    if (this.stockData.length === 0) return;

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

    // Update chart title
    if (
      this.chartOptions &&
      this.chartOptions.plugins &&
      this.chartOptions.plugins.title
    ) {
      this.chartOptions.plugins.title.text = `${this.currentSymbol} - Last 7 Days`;
    }

    // Force chart update if it exists
    if (this.chart) {
      this.chart.update();
    }
  }

  // Update stock info section
  updateStockInfo() {
    if (this.stockData.length === 0) return;

    const latestData = this.stockData[0]; // Most recent day
    const previousData = this.stockData.length > 1 ? this.stockData[1] : null; // Previous day

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

  // Calculate percentage change
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
}
