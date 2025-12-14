import { Routes } from '@angular/router';
import { EmployeeLogin } from './employee-login/employee-login';
import { EmployeeDashboard } from './employee-dashboard/employee-dashboard';
import { CreateCircular } from './create-circular/create-circular';
import { CircularApproval } from './circular-approval/circular-approval';
import { CircularCreater } from './circular-creater/circular-creater';
import { EditCircular } from './edit-circular/edit-circular';
import { AllCirculars } from './all-circulars/all-circulars';
import { CircularDetails } from './circular-details/circular-details';
import { ActivitySummary } from './activity-summary/activity-summary';
import { FilteredCirculars } from './filtered-circulars/filtered-circulars';
import { EmployeeAuthGuard } from './Authentication/employee-auth.guard';
import { EmployeePermissionGuard } from './Authentication/employee-permission.guard';
import { Unauthorized } from './unauthorized/unauthorized';

export const Employee_ROUTS: Routes = [
  // { path: '', redirectTo: 'employee-login', pathMatch: 'full' },
  { path: 'employee-login', component: EmployeeLogin },
  {
    path: 'employee-dashboard',
    canActivate: [EmployeeAuthGuard],
    component: EmployeeDashboard,
  },
  {
    path: 'create-circular',
    canActivate: [EmployeeAuthGuard,EmployeePermissionGuard],
    data: { permissions: ['can_create_circular'] },
    component: CreateCircular,
  },
  {
    path: 'edit-circular',
    canActivate: [EmployeeAuthGuard],
    component: EditCircular,
  },
  {
    path: 'circular-approval',
    canActivate: [EmployeeAuthGuard,EmployeePermissionGuard],
    data: { permissions: ['can_approve_circular'] },
    component: CircularApproval,
  },
  {
    path: 'activity-summary',
     canActivate: [EmployeeAuthGuard],
    component: ActivitySummary,
  },
  {
    path: 'filtered-circulars',
     canActivate: [EmployeeAuthGuard],
    component: FilteredCirculars,
  },

  // { path: 'circular-unread', component: Unreadcircular},
  { 
    path: 'circular-creater', 
    canActivate: [EmployeeAuthGuard], 
    component: CircularCreater 
  },
  { 
    path: 'all-circulars', 
    canActivate: [EmployeeAuthGuard], 
    component: AllCirculars 
  },
  { 
    path: 'circular-details', 
    canActivate: [EmployeeAuthGuard], 
    component: CircularDetails 
  },
  {
    path:'unauthorized', component:Unauthorized
  },
  // { path: '**', component: EmployeeLogin },
];
