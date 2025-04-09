import { Component, OnInit } from '@angular/core';
import { AlphaVantageService } from '../services/alpha-vantage.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css'],
})
export class WatchlistComponent implements OnInit {
  watchlist: any[] = [];

  constructor(private alphaVantageService: AlphaVantageService) {}

  ngOnInit() {
    this.alphaVantageService.getWatchlist().subscribe((data) => {
      this.watchlist = data;
    });
  }
}
