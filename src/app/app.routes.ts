import { Routes } from '@angular/router';
import { StockDataComponent } from './components/stock-data/stock-data.component';

export const routes: Routes = [
  { path: '', component: StockDataComponent },
  { path: 'stock-data', component: StockDataComponent },
];
