import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
const routes: Routes = [ 
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },  
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { 
    path: 'pedidos', 
    loadChildren: () => import('./features/pedidos/pedidos.module').then(m => m.PedidosModule), 
  },
  { path: 'cartera', loadChildren: () => import('./features/cartera/cartera.module').then(m => m.CarteraModule) },
  { path: 'informes', loadChildren: () => import('./features/informes/informes.module').then(m => m.InformesModule) },
  { path: 'ruta-vendedores', loadChildren: () => import('./features/ruta-vendedores/ruta-vendedores.module').then(m => m.RutaVendedoresModule) },
  { path: 'seguimiento-pedidos', loadChildren: () => import('./features/seguimiento-pedidos/seguimiento-pedidos.module').then(m => m.SeguimientoPedidosModule) },
  { path: '**', redirectTo: 'auth/login' }, 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
