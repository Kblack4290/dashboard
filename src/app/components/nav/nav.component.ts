import { Component } from '@angular/core';
import { NgbNavChangeEvent, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  imports: [NgbNavModule],
  styleUrls: ['./nav.component.css'],
})
export class NavComponent {
  active = 0;
  disabled = true;

  onNavChange(event: NgbNavChangeEvent) {
    if (event.nextId === 3) {
      event.preventDefault();
    }
  }

  toggleDisabled() {
    this.disabled = !this.disabled;

    if (this.disabled) {
      this.active = 1;
    }
  }
}
