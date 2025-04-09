import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchlistItemsComponent } from './watchlist-items.component';

describe('WatchlistItemsComponent', () => {
  let component: WatchlistItemsComponent;
  let fixture: ComponentFixture<WatchlistItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WatchlistItemsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WatchlistItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
