import { Routes } from '@angular/router';
import { EmployeeDashboard } from './Employee/employee-dashboard/employee-dashboard';
import { EmployeeLogin } from './Employee/employee-login/employee-login';
import { CreateCircular } from './Employee/create-circular/create-circular';

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
  {
    path:'create-circular', component:CreateCircular
  },
  { path: '**', component:EmployeeLogin },
];
