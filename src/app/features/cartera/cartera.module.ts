import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CarteraRoutingModule } from './cartera-routing.module';
import { CarteraComponent } from './cartera.component';


@NgModule({
  declarations: [
    CarteraComponent
  ],
  imports: [
    CommonModule,
    CarteraRoutingModule
  ]
})
export class CarteraModule { }
