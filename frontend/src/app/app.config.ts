import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection,importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient,withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideClientHydration(withEventReplay()),
     provideHttpClient(withFetch()),
    provideHttpClient(),
    importProvidersFrom(BrowserAnimationsModule, ToastrModule.forRoot({positionClass: 'toast-top-right',
        preventDuplicates: true,
        timeOut: 3000,}))
  ]
};
