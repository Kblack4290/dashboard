import { Component } from '@angular/core';
import { OverviewCardsComponent } from '../components/overview-cards/overview-cards.component';
import { StockDataComponent } from '../components/stock-data/stock-data.component';

@Component({
  selector: 'app-home',
  imports: [OverviewCardsComponent, StockDataComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {}
