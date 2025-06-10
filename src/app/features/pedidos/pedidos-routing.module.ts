import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PedidosComponent } from './pedidos.component';
import { AuthGuard } from 'src/app/core/auth.guard';

const routes: Routes = [ 
  {path: '', component: PedidosComponent,
    canActivate: [AuthGuard],
    data: {roles:['CLIENTE']}}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PedidosRoutingModule { }
