import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, take } from 'rxjs'; 
import { AuthService } from 'src/app/core/auth.service';
import { ShoppingCartService } from 'src/app/core/shopping-cart.service';
import { ItemCarrito } from 'src/app/models/item-carrito';
import { DetallePedido, Pedido } from 'src/app/models/pedido';
import { PedidoService } from '../../core/pedido.service';
import { Sucursal } from '../../models/sucursal';

@Component({
  selector: 'app-cart', 
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {


  cartItems$!: Observable<ItemCarrito[]>; 
  totalItems$!: Observable<number>;
  dias: number = 0;
  observaciones: string = '';


  constructor( 
    private cartService: ShoppingCartService,
    private authService: AuthService,
    private router: Router,
    private pedidoService: PedidoService
  ) {
    console.log('CarritoComponent constructor'); 
   }

  ngOnInit(): void {   
    console.log('🟢 CartComponent ngOnInit ejecutado');
    this.cartItems$ = this.cartService.cartItems$;    
    this.totalItems$ = this.cartService.totalItems$;
    
    this.cartItems$.subscribe(items => {
      console.log('Items en el carrito:', items);
    });

    console.log('Suscribiéndose a dias$ en CarritoComponent');
    this.authService.dias$.subscribe(dias => {
      console.log('>>> Valor recibido en suscripción de dias$ en CarritoComponent:', dias); 
      this.dias = dias;
      console.log('>>> this.dias en CarritoComponent ahora es:', this.dias); 
    });
    console.log('Valor inicial de this.dias en CarritoComponent ngOnInit:', this.dias); 
  }

  irAPedidos() {
    console.log('Navegando a /pedidos desde CarritoComponent');
    this.router.navigate(['/pedidos']);
  }

 
  removeItem(productId: string, bodega: string): void {
    this.cartService.removeItem(productId, bodega);
  }

  updateQuantity(item: ItemCarrito, event: any): void {
     const newQuantity = parseInt(event.target.value, 10);
     if (!isNaN(newQuantity)) {
         this.cartService.updateItemQuantity(item.product_id, item.bodega, newQuantity);
     }
  }

  calculateCartTotal(items: ItemCarrito[]): number {
    return items.reduce((total, item) => total + item.cantidad * item.precio, 0);
  }
  



private getGeolocation(): Promise<{ latitude: number, longitude: number } | null> {
  console.log("Intentando obtener geolocalización...");
  return new Promise((resolve) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }); },
        (error) => { console.error('Error obteniendo geolocalización:', error); resolve(null); },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      console.warn('Geolocalización no soportada.'); resolve(null);
    }
  });
}

async enviarPedido(): Promise<void> {
  try {
    const items = this.cartService.getItems();
    if (!items || items.length === 0) {
      alert('El carrito está vacío.');
      return;
    }

    const detallePedido: DetallePedido[] = items.map(item => ({
      product_id: Number(item.product_id),
      bodega: item.bodega,
      cantidad: item.cantidad,
      producto_referencia: item.producto_referencia
    }));

    const ubicacion = await this.getGeolocation();
    const sucursal = JSON.parse(localStorage.getItem('selectedSucursal') || '{}');

    const pedido: Pedido = {
      EncabezadoPedido: {
        id_app: 0,
        Vendedor_cedula: JSON.parse(localStorage.getItem('selectedSucursal') || '{}').usuario || '',
        Fecha: new Date().toISOString().slice(0, 19).replace('T', ' '), 
        cliente_nit: JSON.parse(localStorage.getItem('nit') || '""'),
        cliente_sucursal: sucursal.sucursal,
        observaciones: this.observaciones || '',
        Latitud: ubicacion?.latitude.toString() || '',
        Longitud: ubicacion?.longitude.toString() || ''
      },
      DetallePedido: detallePedido
    };

    console.log('Pedido final a enviar:', pedido);

    const respuesta = await this.pedidoService.enviarPedidoback(pedido);
    console.log('Respuesta del backend:', respuesta);

    alert('Pedido enviado correctamente.');
    this.cartService.clearCart();
    this.router.navigate(['/auth/home']);

  } catch (error) {
    console.error('Error al enviar el pedido:', error);
    alert('Error al enviar el pedido. Ver consola.');
  }
}



// async enviarPedido(): Promise<void> {
//   alert('ENVIAR PEDIDO fue llamado (solo log, sin alert)');
//   try {
//     const items = await firstValueFrom(this.cartService.cartItems$.pipe(take(1)));
//     console.log('Items recibidos desde observable:', items);

//     if (!items || items.length === 0) {
//       alert('El carrito está vacío después de intentar obtener los ítems.');
//       return;
//     }

//     const detallePedido: DetallePedido[] = items.map(item => ({
//       product_id: Number(item.product_id),
//       bodega: item.bodega,
//       cantidad: item.cantidad,
//       producto_referencia: item.producto_referencia
//     }));

//     console.log('Detalle del Pedido construido:', detallePedido);
//   } catch (e) {
//     console.error('Error inesperado en enviarPedido:', e);
//     alert('Error interno al enviar pedido. Ver consola.');
//   }
// }



}