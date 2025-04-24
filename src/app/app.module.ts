import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from './shared/shared.module';
import { HomeComponent } from './auth/pages/home/home.component';
import { RouterModule } from '@angular/router';
import { RutaVendedoresComponent } from './features/ruta-vendedores/ruta-vendedores.component';
import { SeguimientoPedidosComponent } from './features/seguimiento-pedidos/seguimiento-pedidos.component';
import { MatCardModule } from '@angular/material/card';
import { CartModule } from './features/cart/cart.module';
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    RutaVendedoresComponent,
    SeguimientoPedidosComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    RouterModule,
    MatCardModule,
    CartModule,    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
