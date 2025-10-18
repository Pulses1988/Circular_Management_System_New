import { Routes } from '@angular/router';
import { EmployeeLogin } from './employee-login/employee-login';
import { EmployeeDashboard } from './employee-dashboard/employee-dashboard';
import { CreateCircular } from './create-circular/create-circular';
import { CircularApproval } from './circular-approval/circular-approval';
import { CircularCreater } from './circular-creater/circular-creater';
import { EditCircular } from './edit-circular/edit-circular';

export const Employee_ROUTS: Routes = [
  { path: '', redirectTo: 'employee-login', pathMatch: 'full' },
  { path: 'employee-login', component: EmployeeLogin },
  {
    path: 'employee-dashboard',
    component: EmployeeDashboard,
  },
  { path: 'create-circular', component: CreateCircular },
  // { path: 'edit-circular/:id', component: CreateCircular },
  {
    path: 'edit-circular',
    component: EditCircular,
  },
  {
    path: 'circular-approval',
    component: CircularApproval,
  },

  { path: 'circular-creater', component: CircularCreater },
  { path: '**', component: EmployeeLogin },
];
