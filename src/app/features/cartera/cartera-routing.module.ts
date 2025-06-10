import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CarteraComponent } from './cartera.component';
import { AuthGuard } from 'src/app/core/auth.guard';

const routes: Routes = [ 
  {path: '', component: CarteraComponent,
    canActivate: [AuthGuard],
    data: {roles:['CLIENTE']}}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CarteraRoutingModule { }
