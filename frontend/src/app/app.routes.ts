import { Routes } from '@angular/router';
import { EmployeeLogin } from './Employee/employee-login/employee-login';
import { SmartRedirectGuard } from './Authentication/smart-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [SmartRedirectGuard],
     children: [] 
  },
  {
    path: 'admin',
    loadChildren: () => import('./Admin/admin.routes').then((m) => m.ADMIN_ROUTS),
  },
  {
    path: 'employee',
    loadChildren: () => import('./Employee/employee.routes').then((m) => m.Employee_ROUTS),
  },

  { path: '**', redirectTo: 'employee/employee-login' },
];
