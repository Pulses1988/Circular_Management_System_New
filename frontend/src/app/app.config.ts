import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection,importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './Authentication/auth.interceptor';
import { EmployeeAuthInterceptor } from './Employee/Authentication/employee-auth.interceptor';


export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes), provideClientHydration(withEventReplay()),
     // Standalone HttpClient only executes class-based HTTP_INTERCEPTORS when
     // explicitly configured to read them from DI.
     provideHttpClient(withFetch(), withInterceptorsFromDi()),
     {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: EmployeeAuthInterceptor,
      multi: true
    },
    importProvidersFrom(BrowserAnimationsModule, ToastrModule.forRoot({positionClass: 'toast-top-right',
        preventDuplicates: true,
        timeOut: 3000,}))
  ]
};
