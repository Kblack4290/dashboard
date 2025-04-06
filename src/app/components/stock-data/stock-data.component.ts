import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlphaVantageService } from '../../services/alpha-vantage.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-stock-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-data.component.html',
  styleUrls: ['./stock-data.component.css'],
})
export class StockDataComponent {
  symbolInput = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  private alphaVantageService = inject(AlphaVantageService);

  fetchAndSaveStockData() {
    if (!this.symbolInput) {
      this.errorMessage = 'Please enter a stock symbol';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.alphaVantageService.getStockData(this.symbolInput).subscribe({
      next: (data) => {
        this.alphaVantageService
          .saveStockData(this.symbolInput, data)
          .subscribe({
            next: () => {
              this.successMessage = 'Data saved successfully';
              this.loading = false;
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
