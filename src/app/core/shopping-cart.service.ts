import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ItemCarrito } from '../models/item-carrito';
import { Producto } from '../models/producto';

const STORAGE_KEY = 'shopping_cart';

@Injectable({
  providedIn: 'root'
})
export class ShoppingCartService {

  private _cartItems = new BehaviorSubject<ItemCarrito[]>(this.getCartFromLocalStorage());
  public readonly cartItems$: Observable<ItemCarrito[]> = this._cartItems.asObservable();

  private _totalItems = new BehaviorSubject<number>(this.calculateTotalItems(this._cartItems.getValue()));
  public readonly totalItems$: Observable<number> = this._totalItems.asObservable(); 

  constructor( ) {
    this.cartItems$.subscribe(items => {
      this._totalItems.next(this.calculateTotalItems(items));
      this.saveCartToLocalStorage(items);
    });
  }

  addItem(producto: Producto, cantidad: number): void {
    const currentItems = this._cartItems.getValue();
    const existingItemIndex = currentItems.findIndex(item => item.product_id === producto.id && item.bodega === producto.bodega);

    if (cantidad <= 0) {
      console.warn('Intentando agregar cantidad inválida:', cantidad);
      return;
    }

    if (existingItemIndex > -1) {
      currentItems[existingItemIndex].cantidad += cantidad;
    } else {
      const newItem: ItemCarrito = {
        product_id: producto.id,
        producto_referencia: producto.referencia,
        cantidad: cantidad,
        bodega: producto.bodega,
        nombre: producto.nombre,
        precio: producto.lista_precio && producto.lista_precio.length > 0 ? producto.lista_precio[0].precio : 0,
        factor: producto.factor,
        descuento: producto.descuento,
      };
      currentItems.push(newItem);
     // console.log('item agregado', newItem);
    }
    this._cartItems.next([...currentItems]);
    //localStorage.setItem('carrito', JSON.stringify(this._cartItems.getValue()));

  }

  removeItem(productId: string, bodega: string): void {
    const currentItems = this._cartItems.getValue();
    const updatedItems = currentItems.filter(item => !(item.product_id === productId && item.bodega === bodega));
    this._cartItems.next(updatedItems);
    //console.log(`item eliminado: ${productId} / ${bodega}`);
    //localStorage.setItem('carrito', JSON.stringify(this._cartItems.getValue()));    

  }

  updateItemQuantity(productId: string, bodega: string, newCantidad: number): void {
    const currentItems = this._cartItems.getValue();
    const itemToUpdate = currentItems.find(item => item.product_id === productId && item.bodega === bodega);

    if (itemToUpdate) {
      if (newCantidad > 0) {
        itemToUpdate.cantidad = newCantidad;
        itemToUpdate.subtotal = itemToUpdate.cantidad * itemToUpdate.precio;
        this._cartItems.next([...currentItems]);
       // console.log('cantidad modificada', itemToUpdate);
        // localStorage.setItem('carrito', JSON.stringify(this._cartItems.getValue()));    
      } else {
        this.removeItem(productId, bodega);
      }
    }
  }

  clearCart(): void {
    this._cartItems.next([]);
    localStorage.removeItem(STORAGE_KEY);
   // console.log('carrito limpiado');
    //localStorage.removeItem('carrito');

  }

  getItems(): ItemCarrito[] {
    const value = this._cartItems.getValue();
   // console.log('getItems() devuelve:', value);
    return value;
    //return this._cartItems.getValue();
  }

  private calculateTotalItems(items: ItemCarrito[]): number {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }

  private saveCartToLocalStorage(items: ItemCarrito[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
     // console.error('Error guardando en localStorage', e);
    }
  }

  private getCartFromLocalStorage(): ItemCarrito[] {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      //console.error('Error leyendo localStorage', e);
      return [];
    }
  }

  
  
}