import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { User } from './services/user';
import { FormsModule } from '@angular/forms';   // ✅ For ngModel
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-root',
  imports: [FormsModule,CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
  users = [];
   username = '';
  email = '';

  constructor(private userService: User) {}
  ngOnInit() {
  }
  onSubmit() {
    const user = { username: this.username, email: this.email };
    this.userService.createUser(user).subscribe({
      next: (res) => {
        console.log('User added:', res);
        alert('User added successfully!');
      },
      error: (err) => {
        console.error('Error adding user:', err);
        alert('Failed to add user');
      }
    });
  }
}

