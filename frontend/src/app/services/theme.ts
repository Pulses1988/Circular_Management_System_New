import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly STORAGE_KEY = 'app-theme';
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.initializeTheme();
  }

  initializeTheme(): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = this.getTheme();
    this.applyTheme(savedTheme);
  }

  applyTheme(theme: Theme): void {

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const html = document.documentElement;

    // Remove old theme
    html.classList.remove('light-theme', 'dark-theme');

    // Add new theme
    html.classList.add(`${theme}-theme`);

    // Browser color scheme
    html.style.colorScheme = theme;

    // Save theme
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  getTheme(): Theme {

    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }

    return (localStorage.getItem(this.STORAGE_KEY) as Theme) || 'light';
  }
}