import { Routes } from '@angular/router';
import { EmployeeDashboard } from './Employee/employee-dashboard/employee-dashboard';
import { EmployeeLogin } from './Employee/employee-login/employee-login';

export const routes: Routes = [
  {
    path:'',redirectTo:'employee-login',pathMatch: 'full' 
  },
  {
    path: 'admin',
    loadChildren: () => import('./Admin/admin.routes').then((m) => m.ADMIN_ROUTS),
  },
  {
    path:'employee-dashboard', component:EmployeeDashboard
  },
  {
    path:'employee-login', component:EmployeeLogin
  },
  { path: '**', component:EmployeeLogin },
];
