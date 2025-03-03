import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CarteraRoutingModule } from './cartera-routing.module';
import { CarteraComponent } from './cartera.component';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    CarteraComponent
  ],
  imports: [
    CommonModule,
    CarteraRoutingModule,
    SharedModule
  ]
})
export class CarteraModule { }
