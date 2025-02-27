import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SeguimientoPedidosComponent } from './seguimiento-pedidos.component';

const routes: Routes = [ 
  {path: '', component: SeguimientoPedidosComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SeguimientoPedidosRoutingModule { }
