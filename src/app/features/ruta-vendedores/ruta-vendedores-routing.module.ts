import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RutaVendedoresComponent } from './ruta-vendedores.component';

const routes: Routes = [ 
  {path: '', component: RutaVendedoresComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RutaVendedoresRoutingModule { }
