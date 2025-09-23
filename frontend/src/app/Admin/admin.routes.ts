import { Routes } from '@angular/router';
import { AdminSignup } from './admin-signup/admin-signup';
import { AdminLogin } from './admin-login/admin-login';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { AdminBranchManagement } from './admin-branch-management/admin-branch-management';
import { AdminDepartmentManegement } from './admin-department-manegement/admin-department-manegement';
import { EmployeeMangement } from './employee-mangement/employee-mangement';
import { AdminRolesManegement } from './admin-roles-manegement/admin-roles-manegement';

export const ADMIN_ROUTS: Routes = [
  { path: '', redirectTo: 'admin-login', pathMatch: 'full' },
  { path: 'admin-signup', component: AdminSignup },
  { path: 'admin-login', component: AdminLogin },
  { path: 'admin-dashboard', component: AdminDashboard },
  { path: 'admin-branch', component: AdminBranchManagement },
  { path: 'admin-department-manegement', component: AdminDepartmentManegement },
  { path: 'admin-employee-management', component: EmployeeMangement },
  { path: 'admin-role-manegement', component: AdminRolesManegement },
];
