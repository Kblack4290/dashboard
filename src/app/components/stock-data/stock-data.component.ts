import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlphaVantageService } from '../../services/alpha-vantage.service';
import { inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { SymbolService } from '../../services/symbol.service';

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

  ngOnInit() {
    this.symbolService.symbol$.subscribe((symbol) => {
      this.currentSymbol = symbol;
      this.symbolInput = symbol;
      this.loadStockData(symbol);
    });

    this.loadStockData(this.currentSymbol);
  }

  loadStockData(symbol: string) {
    this.loading = true;
    this.alphaVantageService.getStockDataFromDb(symbol).subscribe({
      next: (data) => {
        this.stockData = data.slice(0, 7);
        this.updateChart();
        this.updateStockInfo();
        this.loading = false;
      },
      error: (err) => {
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
