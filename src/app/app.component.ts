import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StockDataComponent } from './components/stock-data/stock-data.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, StockDataComponent],
  template: `
    <h1>{{ title }}</h1>
    <app-stock-data></app-stock-data>
    <router-outlet></router-outlet>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Stock Dashboard';
}
