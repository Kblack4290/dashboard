import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { AlphaVantageService } from '../services/alpha-vantage.service';
import { SymbolService } from '../services/symbol.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { switchMap, map } from 'rxjs/operators';
import { combineLatest, from, of } from 'rxjs';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css'],
})
export class WatchlistComponent implements OnInit {
  watchlist: any[] = [];
  loading = true;
  errorMessage = '';
  isBrowser: boolean;

  constructor(
    private alphaVantageService: AlphaVantageService,
    private symbolService: SymbolService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    // Only load watchlist in browser environment
    if (this.isBrowser) {
      this.loadWatchlist();
    } else {
      // For server-side rendering, set empty state
      this.watchlist = [];
      this.loading = false;
    }
  }

  loadWatchlist() {
    // Skip if not in browser
    if (!this.isBrowser) {
      this.loading = false;
      return;
    }

    this.loading = true;

    this.alphaVantageService
      .getWatchlist()
      .pipe(
        switchMap((watchlist) => {
          if (watchlist.length === 0) {
            this.loading = false;
            return of([]);
          }

          const enrichedWatchlistItems = watchlist.map((item) =>
            this.symbolService.getCompanyName(item.symbol).pipe(
              map((companyName) => ({
                ...item,
                name: companyName,
              }))
            )
          );

          return combineLatest(enrichedWatchlistItems);
        })
      )
      .subscribe({
        next: (enrichedWatchlist) => {
          this.watchlist = enrichedWatchlist;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading watchlist:', err);
          this.errorMessage = 'Failed to load watchlist';
          this.loading = false;
        },
      });
  }

  loadWatchlistSequential() {
    this.loading = true;

    this.alphaVantageService.getWatchlist().subscribe({
      next: (watchlist) => {
        if (watchlist.length === 0) {
          this.watchlist = [];
          this.loading = false;
          return;
        }

        const enrichedWatchlist: any[] = [];
        let processed = 0;

        watchlist.forEach((item) => {
          this.symbolService.getCompanyName(item.symbol).subscribe({
            next: (companyName) => {
              enrichedWatchlist.push({
                ...item,
                name: companyName,
              });

              processed++;
              if (processed === watchlist.length) {
                this.watchlist = enrichedWatchlist;
                this.loading = false;
              }
            },
            error: (err) => {
              console.error(
                `Error fetching company name for ${item.symbol}:`,
                err
              );
              enrichedWatchlist.push({
                ...item,
                name: item.symbol,
              });

              processed++;
              if (processed === watchlist.length) {
                this.watchlist = enrichedWatchlist;
                this.loading = false;
              }
            },
          });
        });
      },
      error: (err) => {
        console.error('Error loading watchlist:', err);
        this.errorMessage = 'Failed to load watchlist';
        this.loading = false;
      },
    });
  }

  refreshWatchlist() {
    this.loadWatchlist();
  }

  formatDayRange(range: string): string {
    if (!range) return 'N/A';
    const parts = range.split(' - ');

    if (parts.length !== 2) return range;

    const low = parseFloat(parts[0].replace('$', ''));
    const high = parseFloat(parts[1].replace('$', ''));

    if (isNaN(low) || isNaN(high)) return range;

    return `$${low.toFixed(2)} - $${high.toFixed(2)}`;
  }
}
