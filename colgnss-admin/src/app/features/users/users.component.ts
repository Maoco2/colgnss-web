import { Component } from '@angular/core';
import { UsersListComponent } from './users-list.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [UsersListComponent],
  template: `<app-users-list></app-users-list>`,
})
export class UsersComponent {}
