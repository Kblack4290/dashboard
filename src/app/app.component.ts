import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './components/nav/nav.component';
import { OverviewCardsComponent } from './components/overview-cards/overview-cards.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  template: `
    <h1>{{ title }}</h1>
    <app-nav></app-nav>
    <main>
      <!-- <overview-cards></overview-cards> -->
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Financial Dashboard';
}
