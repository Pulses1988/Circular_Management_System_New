import { Routes } from '@angular/router';
import { AdminLogin } from './Admin/admin-login/admin-login';
import { AdminSignup } from './Admin/admin-signup/admin-signup';
import { AdminDashboard } from './Admin/admin-dashboard/admin-dashboard';

export const routes: Routes = [
    {path:'', redirectTo:'admin-login',pathMatch:'full'},
    {path:'admin-signup', component:AdminSignup},
    {path:'admin-login',component:AdminLogin},
    {path:'admin-dashboard',component:AdminDashboard}
];
