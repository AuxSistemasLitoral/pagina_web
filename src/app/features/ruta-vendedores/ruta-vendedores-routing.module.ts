import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RutaVendedoresComponent } from './ruta-vendedores.component';
import { AuthGuard } from 'src/app/core/auth.guard';

const routes: Routes = [ 
  {
    path: '', 
    component: RutaVendedoresComponent,
    canActivate: [AuthGuard],
    data: {roles:['VENDEDOR', 'SUPERVISOR']}}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RutaVendedoresRoutingModule { }
