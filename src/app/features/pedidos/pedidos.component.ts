import { Component, OnInit } from '@angular/core';
import { PedidoService } from '../../core/pedido.service';
import { SharedDataService } from 'src/app/core/shared-data.service';
import { Subscription } from 'rxjs';
import { Producto } from 'src/app/models/producto';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit {
  productos: Producto[] = [];
  cargando : boolean = false;
  usuario: string = '';
  listaprecio: string = '';


  private dataSubscription!: Subscription;


  constructor(
    private pedidoService: PedidoService,
    private sharedDataService: SharedDataService
  ){}

  ngOnInit(): void {
    this.dataSubscription = this.sharedDataService.getDataReadyObservable().subscribe((ready) => {
      if (ready) {
        this.usuario = this.sharedDataService.getUsuario();
        this.listaprecio = this.sharedDataService.getListaPrecio();
        console.log('Usuario en pedidos:', this.usuario);
        console.log('Lista de precios en pedidos:', this.listaprecio);
        this.obtenerProductos();
      }
    });
  }
  
  ngOnDestroy(): void {
    this.dataSubscription.unsubscribe();
  }
  

  obtenerProductos() {
    if (this.usuario && this.listaprecio) {
      this.cargando = true;
      console.log('Llamando a getProducts con:', this.usuario, this.listaprecio); 
  
      this.pedidoService.getProducts(this.usuario, this.listaprecio).subscribe(
        (response: Producto[]) => {  
          // Convertir lista_precio si es un string
          this.productos = response.map(producto => ({
            ...producto,
            lista_precio: typeof producto.lista_precio === 'string' 
              ? JSON.parse(producto.lista_precio) 
              : producto.lista_precio
          }));
  
          console.log('Productos procesados:', this.productos);
          this.cargando = false;
        },
        (error) => {
          console.error('Error obteniendo los productos', error);
          this.cargando = false;
        }
      );
    } else {
      console.warn('Para visualizar los productos debes elegir una sucursal');
    }
  }
  
  

}
