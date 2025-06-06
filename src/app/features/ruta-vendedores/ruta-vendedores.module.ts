import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RutaVendedoresRoutingModule } from './ruta-vendedores-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { RutaVendedoresComponent } from './ruta-vendedores.component';


@NgModule({
  declarations: [
    RutaVendedoresComponent 
  ],
  imports: [
    CommonModule,
    RutaVendedoresRoutingModule,
    SharedModule,
    FormsModule
  ]
})
export class RutaVendedoresModule { }
