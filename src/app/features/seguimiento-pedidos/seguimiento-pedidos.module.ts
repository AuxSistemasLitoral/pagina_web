import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SeguimientoPedidosRoutingModule } from './seguimiento-pedidos-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SeguimientoPedidosRoutingModule,
    SharedModule
  ]
})
export class SeguimientoPedidosModule { }
