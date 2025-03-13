import { Component, OnDestroy, OnInit } from '@angular/core';
import { PedidoService } from '../../core/pedido.service';
import { SharedDataService } from 'src/app/core/shared-data.service';
import { Subscription } from 'rxjs';
import { Producto } from 'src/app/models/producto';
import { Proveedor } from 'src/app/models/proveedor';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit, OnDestroy {
  productos: Producto[] = [];
  proveedores: Proveedor[]= [];
  productosFiltrados: any[] = [];
  cargando : boolean = false;
  usuario: string = '';
  listaprecio: string = '';
  proveedoresDuplicados: Proveedor[] = [];
  private dataSubscription!: Subscription;

  constructor(
    private pedidoService: PedidoService,
    private sharedDataService: SharedDataService
  ){}

  ngOnInit(): void {
    this.obtenerProveedores();
    this.dataSubscription = this.sharedDataService.getDataReadyObservable().subscribe((ready) => {
      if (ready) {
        this.usuario = this.sharedDataService.getUsuario();
        this.listaprecio = this.sharedDataService.getListaPrecio();
        console.log('Usuario en pedidos:', this.usuario);
        console.log('Lista de precios en pedidos:', this.listaprecio);
        if (!this.listaprecio) {
          console.error("⚠️ Error: listaPrecio no tiene valor en ngOnInit");
        }
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
        (response: any[]) => {
          this.productos = response.map(producto => ({
            ...producto,
            proveedor: producto.proveedor || 'Desconocido',
            descuento: Number(producto.descuento) || 0,
            lista_precio: Array.isArray(producto.lista_precio)
              ? producto.lista_precio
              : JSON.parse(producto.lista_precio || '[]')
          }));
          this.productos.sort((a, b) => b.descuento - a.descuento);
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

  obtenerProveedores() {
    this.pedidoService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
        this.proveedoresDuplicados = [...this.proveedores, ...this.proveedores]; 
        console.log('Proveedores obtenidos:', this.proveedores); 
      },
      error: (err) => console.error('Error obteniendo proveedores', err)
    });
  }  
  
  filtrarPorProveedor(proveedor: string) {
    if (!this.listaprecio) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal no seleccionada',
        text: 'Debes seleccionar una sucursal antes de ver los productos.',
        background: '#2c2c2c',
        color: '#ffffff',
        confirmButtonColor: '#f39c12',
        confirmButtonText: 'Entendido',
      });
      return;
    }
  
    console.log(`Filtrando productos para proveedor: ${proveedor} y listaPrecio: ${this.listaprecio}`);
  
    this.cargando = true; 
  
    this.pedidoService.getProductosProveedor(proveedor, this.listaprecio, this.usuario).subscribe(
      (productos) => {
        console.log('Productos obtenidos para el proveedor:', productos);
  
        // Verificar si la respuesta está vacía
        if (!productos || productos.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'Sin productos disponibles',
            text: `No hay productos disponibles para el proveedor ${proveedor} en esta sucursal.`,
            background: '#2c2c2c',
            color: '#ffffff',
            confirmButtonColor: '#3498db',
            confirmButtonText: 'Entendido',
          });
        }
  
        this.productos = productos.map((producto) => ({
          ...producto,
          lista_precio: typeof producto.lista_precio === 'string' 
            ? JSON.parse(producto.lista_precio) 
            : producto.lista_precio
        }));
  
        this.cargando = false;
      },
      (error) => {
        console.error('Error al obtener productos del proveedor', error);
        this.cargando = false;
      }
    );
  }
  
  
  imagenError(event: any, proveedorNombre: string) {
    event.target.src = 'assets/prov/default.png'; 
    console.warn(`Imagen no encontrada para ${proveedorNombre}, usando imagen por defecto.`);
  }
  

  agregarAlCarrito(producto: Producto) {
    if (!producto.cantidad || producto.cantidad <= 0) {
      alert("Por favor, ingresa una cantidad válida.");
      return;
    }    
    console.log("Producto agregado:", producto);
    alert(`Se agregó ${producto.cantidad} unidad(es) de ${producto.nombre} al carrito.`);
  }
  

  

}
