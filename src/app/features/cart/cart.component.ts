import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs'; 
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


  constructor(private cartService: ShoppingCartService) { }

  ngOnInit(): void {   
    this.cartItems$ = this.cartService.cartItems$;    
    this.totalItems$ = this.cartService.totalItems$;
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