import { Routes } from '@angular/router';
import { AdminLogin } from './Admin/admin-login/admin-login';
import { AdminSignup } from './Admin/admin-signup/admin-signup';
import { AdminDashboard } from './Admin/admin-dashboard/admin-dashboard';
import { AdminBranchManagement } from './Admin/admin-branch-management/admin-branch-management';
import { AdminDepartmentManegement } from './Admin/admin-department-manegement/admin-department-manegement';
import { AdminRolesManegement } from './Admin/admin-roles-manegement/admin-roles-manegement';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./Admin/admin.routes').then((m) => m.ADMIN_ROUTS),
  },
  { path: '**', redirectTo: '' },
];
