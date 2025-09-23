import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { User } from './services/user';
import { FormsModule } from '@angular/forms'; // ✅ For ngModel
import { CommonModule } from '@angular/common';
import { ToastComponent } from './toast/toast-component/toast-component';
import { AdminSidebar } from './Admin/admin-sidebar/admin-sidebar';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule, RouterModule, ToastComponent, AdminSidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('frontend');
  users = [];
  username = '';
  email = '';

  currentRoute: string = '';

  constructor(private userService: User, private router: Router) {
    router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
      }
    });
  }

  showAdminSidebar(): boolean {
    const isAdminRoute = this.currentRoute.startsWith('/admin');
    const isLoginRoute = this.currentRoute.includes('/admin-login');
    const isSignupRoute = this.currentRoute.includes('/admin-signup');
    const unauthorised = this.currentRoute.includes('/unauthorized');
    return isAdminRoute && !isLoginRoute && !isSignupRoute && !unauthorised;
  }

  ngOnInit() {}
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
      },
    });
  }
}
