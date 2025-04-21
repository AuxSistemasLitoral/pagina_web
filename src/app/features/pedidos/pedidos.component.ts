import { Component, ElementRef, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { PedidoService } from '../../core/pedido.service';
import { SharedDataService } from 'src/app/core/shared-data.service';
import { Subscription, switchMap } from 'rxjs';
import { Producto } from 'src/app/models/producto';
import { Proveedor } from 'src/app/models/proveedor';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.css']
})
export class PedidosComponent implements OnInit, OnDestroy {

  @ViewChild('scrollContainer', { static: true }) scrollContainer!: ElementRef;
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  productosFiltrados: any[] = [];
  cargando: boolean = false;
  usuario: string = '';
  listaprecio: string = '';
  proveedoresDuplicados: Proveedor[] = [];
  private dataSubscription!: Subscription;
  private diasSubscription!: Subscription;
  isDragging = false;
  startX = 0;
  scrollLeft = 0;
  animationRunning = true;
  scrollSpeed = 0.3; 
  interval: any;
  animarProveedores = true; 

  constructor(
    private pedidoService: PedidoService,
    private sharedDataService: SharedDataService,
    private renderer: Renderer2,
  ) { }  
      
  cargarDatos(): void {  
    this.dataSubscription = this.sharedDataService.getDataReadyObservable().subscribe((ready) => {
      if (ready) {
        this.usuario = this.sharedDataService.getUsuario();
        this.listaprecio = this.sharedDataService.getListaPrecio();  
        this.obtenerProveedores();
        this.obtenerProductos();
      } else {
        console.warn('⏳ Datos aún no listos, esperando...');
      }
    });
  } 
  
  
  ngOnInit(): void {   
      this.obtenerProveedores();
        this.dataSubscription = this.sharedDataService.getDataReadyObservable().subscribe((ready) => {
          if (ready) {
            this.usuario = this.sharedDataService.getUsuario();
            this.listaprecio = this.sharedDataService.getListaPrecio();
            this.obtenerProductos();
           }          
        });
  }

  ngAfterViewInit() {
    const container = this.scrollContainer.nativeElement;  
    this.startAutoScroll();

    this.renderer.listen(container, 'mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      container.classList.add('active');
      this.startX = e.pageX - container.offsetLeft;
      this.scrollLeft = container.scrollLeft;
      this.stopAutoScroll();
    });

    this.renderer.listen(container, 'mouseup', () => {
      this.isDragging = false;
      container.classList.remove('active');
      this.startAutoScroll();
    });

    this.renderer.listen(container, 'mouseleave', () => {
      this.isDragging = false;
      this.startAutoScroll();
    });

    this.renderer.listen(container, 'mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - this.startX) * 2; 
      container.scrollLeft = this.scrollLeft - walk;
    });
    
    this.renderer.listen(container, 'scroll', () => {
      const scrollMax = container.scrollWidth / 2;
      if (container.scrollLeft >= scrollMax) {
        container.scrollLeft = 0;
      }
    });
  }

 
  startAutoScroll() {
    if (this.interval) return; 
    const container = this.scrollContainer.nativeElement;
    this.interval = setInterval(() => {
      container.scrollLeft += this.scrollSpeed;
      const scrollMax = container.scrollWidth / 2;
      if (container.scrollLeft >= scrollMax) {
        container.scrollLeft = 0;
      }
    }, 30);
  }
 
  stopAutoScroll() {
    clearInterval(this.interval);
    this.interval = null;
  }

  ngOnDestroy(): void {
    if (this.diasSubscription) this.diasSubscription.unsubscribe();
    if (this.dataSubscription) this.dataSubscription.unsubscribe();
  }

  obtenerProductos() {
    this.animarProveedores = false;
    if (this.usuario && this.listaprecio) {
        this.cargando = true;
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
                if (this.productos.length === 0) {
                  Swal.fire({
                    icon: 'info',
                    title: 'Sin productos',
                    text: 'No hay productos disponibles en esta sucursal.',
                    confirmButtonColor: '#05983d'
                  });
                }
                this.cargando = false;
            },
            (error) => {
              this.cargando = false;
              console.error('Error obteniendo los productos', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un problema al obtener los productos.',
                confirmButtonColor: '#e65c00'
              });
            }
          );
    } else {
        console.warn('Para visualizar los productos debes elegir una sucursal');
    }
}


  obtenerProveedores() {
    this.animarProveedores = false;
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

    this.pedidoService.getProductosProveedor(proveedor, this.listaprecio, this.usuario).subscribe(
      (productos) => {
        console.log('Productos obtenidos para el proveedor:', productos);

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

getProveedorImageUrl(proveedorNombre: string): string {
  if (!proveedorNombre) return 'assets/prov/default.png';
  const nombreFormateado = proveedorNombre
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');    
  return `assets/prov/${nombreFormateado}.png`;
}

getProductImageUrl(referencia: string): string { 
  return `assets/img/${referencia}.png`;
}

handleProductImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.onerror = null; 
  img.src = 'assets/img/default.png';
}


trackByProveedor(index: number, proveedor: Proveedor): string {
  return proveedor.proveedor || index.toString();
}

  imagenError(event: Event, proveedorNombre: string) {
    const imgElement = event.target as HTMLImageElement;    
    
    imgElement.onerror = null; 
    imgElement.src = 'assets/prov/default.png';
    if (!this.erroresImagenReportados.has(proveedorNombre)) {
      console.warn(`Imagen no encontrada para ${proveedorNombre}, usando imagen por defecto.`);
      this.erroresImagenReportados.add(proveedorNombre);
    }
  } 
 
  private erroresImagenReportados = new Set<string>();
  
  agregarAlCarrito(producto: Producto) {
    if (!producto.cantidad || producto.cantidad <= 0) {
      alert("Por favor, ingresa una cantidad válida.");
      return;
    }
    console.log("Producto agregado:", producto);
    alert(`Se agregó ${producto.cantidad} unidad(es) de ${producto.nombre} al carrito.`);
  }

}

