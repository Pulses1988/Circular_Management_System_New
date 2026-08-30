import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CircularService } from '../../services/circular-service';
import { ThemeService } from '../../services/theme';
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings implements OnInit {

  isDarkMode = false;
  maxApprovers: number = 1;

  constructor(
    private circularService: CircularService, 
     private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadMaxApprovers(); 
    this.isDarkMode =
    this.themeService.getTheme() === 'dark';
  }

  loadMaxApprovers(): void {
    this.circularService.getMaxApprovers().subscribe({
      next: (response: any) => {
        this.maxApprovers = response.maxApprovers;
        console.log('Maximum approvers:', this.maxApprovers);
      },
      error: (error) => {
        console.error('Error loading maximum approvers:', error);
      }
    });
  }

  onApproverLimitChange(): void {
    this.circularService
      .updateMaxApprovers(this.maxApprovers)
      .subscribe({
        next: (response: any) => {
          console.log('Setting updated:', response);
        },
        error: (error) => {
          console.error('Error updating setting:', error);
        }
      });
  } 

onThemeChange() {

  if (this.isDarkMode) {
    this.themeService.applyTheme('dark');
  } else {
    this.themeService.applyTheme('light');
  }

} 

changeTheme(theme: 'light' | 'dark'): void {
  this.isDarkMode = theme === 'dark';
  this.themeService.applyTheme(theme);
}


}