import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, Renderer2 } from '@angular/core';
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

  @ViewChild('scrollContainer', { static: true }) scrollContainer!: ElementRef;
  productos: Producto[] = [];
  proveedores: Proveedor[] = [];
  productosFiltrados: any[] = [];
  cargando: boolean = false;
  usuario: string = '';
  listaprecio: string = '';
  proveedoresDuplicados: Proveedor[] = [];
  private dataSubscription!: Subscription;

  isDragging = false;
  startX = 0;
  scrollLeft = 0;
  animationRunning = true;

  constructor(
    private pedidoService: PedidoService,
    private sharedDataService: SharedDataService,
    private renderer: Renderer2
  ) { }

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

  ngAfterViewInit() {
    const container = this.scrollContainer.nativeElement;
    
    // Mouse presionado
    this.renderer.listen(container, 'mousedown', (e: MouseEvent) => {
      this.isDragging = true;
      container.classList.add('active');
      this.startX = e.pageX - container.offsetLeft;
      this.scrollLeft = container.scrollLeft;
      this.animationRunning = false; // Pausar la animación
      container.style.animationPlayState = 'paused';
    });

    // Mouse suelto
    this.renderer.listen(container, 'mouseup', () => {
      this.isDragging = false;
      container.classList.remove('active');
      this.animationRunning = true; // Reanudar la animación
      container.style.animationPlayState = 'running';
    });

    // Mouse sale del área
    this.renderer.listen(container, 'mouseleave', () => {
      this.isDragging = false;
      this.animationRunning = true; // Reanudar la animación
      container.style.animationPlayState = 'running';
    });

    // Movimiento del mouse
    this.renderer.listen(container, 'mousemove', (e: MouseEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - this.startX) * 1.5; // Velocidad del arrastre
      container.scrollLeft = this.scrollLeft - walk;
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
