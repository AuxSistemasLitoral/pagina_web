import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InformesComponent } from './informes.component';
import { AuthGuard } from 'src/app/core/auth.guard';

const routes: Routes = [ 
  {path: '', component: InformesComponent,
    canActivate: [AuthGuard],
    data: {roles:['VENDEDOR', 'SUPERVISOR']}}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InformesRoutingModule { }
