import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs'; 
import { AuthService } from 'src/app/core/auth.service';
import { ShoppingCartService } from 'src/app/core/shopping-cart.service';
import { ItemCarrito } from 'src/app/models/item-carrito';

@Component({
  selector: 'app-cart', 
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {


  cartItems$!: Observable<ItemCarrito[]>; 
  totalItems$!: Observable<number>;
  dias: number = 0;


  constructor( 
    private cartService: ShoppingCartService,
    private authService: AuthService,
     private router: Router
  ) {
    console.log('CarritoComponent constructor'); 
   }

  ngOnInit(): void {   
    console.log('CarritoComponent ngOnInit');
   
    this.cartItems$ = this.cartService.cartItems$;    
    this.totalItems$ = this.cartService.totalItems$;

    console.log('Suscribiéndose a dias$ en CarritoComponent');
    this.authService.dias$.subscribe(dias => {
      console.log('>>> Valor recibido en suscripción de dias$ en CarritoComponent:', dias); // MUY IMPORTANTE
      this.dias = dias;
      console.log('>>> this.dias en CarritoComponent ahora es:', this.dias); // Verifica el valor asignado
    });
    console.log('Valor inicial de this.dias en CarritoComponent ngOnInit:', this.dias); // Verifica el valor al inicio
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
    let total = 0;
    for (const item of items) {
        total += (item.cantidad * item.precio);
    }
    
    return items.reduce((totalAcumulado, itemActual) => {
        return totalAcumulado + (itemActual.cantidad * itemActual.precio);
    }, 0); 
    
}

}