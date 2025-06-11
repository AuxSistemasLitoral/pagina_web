import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InformesRoutingModule } from './informes-routing.module';
import { InformesComponent } from './informes.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    InformesComponent
  ],
  imports: [
    CommonModule,
    InformesRoutingModule,
    SharedModule,
    FormsModule
  ]
})
export class InformesModule { }
