import { Routes } from '@angular/router';
// import { StockDataComponent } from './components/stock-data/stock-data.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  // { path: 'stock-data', component: StockDataComponent },
  {
    path: 'watchlist',
    loadComponent: () =>
      import('./watchlist/watchlist.component').then(
        (m) => m.WatchlistComponent
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./about/about.component').then((m) => m.AboutComponent),
  },
];
