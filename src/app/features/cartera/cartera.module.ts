import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CarteraRoutingModule } from './cartera-routing.module';
import { CarteraComponent } from './cartera.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    CarteraComponent
  ],
  imports: [
    CommonModule,
    CarteraRoutingModule,
    SharedModule,
    FormsModule
  ]
})
export class CarteraModule { }
 