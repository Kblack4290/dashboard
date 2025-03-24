import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  standalone: true,
  imports: [NgbNavModule, RouterModule, CommonModule],
  styleUrls: ['./nav.component.css'],
})
export class NavComponent {
  active = 1;
}
