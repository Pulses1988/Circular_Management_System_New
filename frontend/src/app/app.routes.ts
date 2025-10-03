import { Routes } from '@angular/router';
import { EmployeeLogin } from './Employee/employee-login/employee-login';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'employee-login',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    loadChildren: () => import('./Admin/admin.routes').then((m) => m.ADMIN_ROUTS),
  },
  {
    path: 'employee',
    loadChildren: () => import('./Employee/employee.routes').then((m) => m.Employee_ROUTS),
  },

  { path: '**', component: EmployeeLogin },
];
