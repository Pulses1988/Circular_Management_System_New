import { Routes } from '@angular/router';
import { AdminSignup } from './admin-signup/admin-signup';
import { AdminLogin } from './admin-login/admin-login';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { AdminBranchManagement } from './admin-branch-management/admin-branch-management';
import { AdminDepartmentManegement } from './admin-department-manegement/admin-department-manegement';
import { EmployeeMangement } from './employee-mangement/employee-mangement';
import { AdminRolesManegement } from './admin-roles-manegement/admin-roles-manegement';
import { AuthGuard } from '../Authentication/auth.guard';
import { RoleGuard } from '../Authentication/role.guard';
import { UnauthorizedPage } from './unauthorized-page/unauthorized-page';
import { AdminCircularSettings } from './admin-circular-settings/admin-circular-settings';

export const ADMIN_ROUTS: Routes = [
  { path: '', redirectTo: 'admin-login', pathMatch: 'full' },
  { path: 'admin-signup', component: AdminSignup },
  { path: 'admin-login', component: AdminLogin },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboard,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin-branch', 
    component: AdminBranchManagement,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['HO_ADMIN'] }
  },
  { 
    path: 'admin-department-management', 
    component: AdminDepartmentManegement,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['HO_ADMIN', 'BRANCH_ADMIN'] }
  },
  { 
    path: 'admin-employee-management', 
    component: EmployeeMangement,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['HO_ADMIN', 'BRANCH_ADMIN'] }
  },
  { 
    path: 'admin-role-management', 
    component: AdminRolesManegement,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['HO_ADMIN', 'BRANCH_ADMIN'] }
  },
  { 
    path: 'admin-circular-settings', 
    component: AdminCircularSettings,
    // canActivate: [AuthGuard, RoleGuard],
    // data: { roles: ['HO_ADMIN', 'BRANCH_ADMIN'] }
  },
  // Add unauthorized route
  { 
    path: 'unauthorized', 
    component: UnauthorizedPage 
  },
  // Catch all route - redirect to login
  { 
    path: '**', 
    redirectTo: 'admin-login' 
  }
];
