import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth.service';
import { SharedDataService } from '../../core/shared-data.service';
import { environment } from 'src/environments/environments.prod'; 
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { Observable, Subscription } from 'rxjs';
import { ShoppingCartService } from 'src/app/core/shopping-cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  private baseUrl = environment.apiBaseUrl;
  home = this.baseUrl + '/auth/home';
  usuario: any = {};
  sucursales: any[] = [];
  isHome: boolean = false;
  selectedSucursal: any | null = null;
  asesor: string = '';
 // isLogin: boolean = false;
  dias: number = 0;
  id: string = '';
  cupo: number | null = null;
  disponible: number = 0;
  totalItems$!: Observable<number>;
  cartItemsSubscription!: Subscription;
  mostrarSelectorSucursal: boolean = true;
  isLoggedInAuth$: Observable<boolean>;

  constructor(
    private router: Router,
    public authService: AuthService,
    private sharedDataService: SharedDataService, 
    private dialog: MatDialog,
    private cartService: ShoppingCartService
  ) {
     this.isLoggedInAuth$ = this.authService.isLoggedIn$; 
   }
 
  ngOnInit() {
    console.log('HeaderComponent ngOnInit');

    // Suscribirse a los cambios de isLoggedInAuth$ para loguear info
    this.isLoggedInAuth$.subscribe(loggedIn => {
      console.log('Header - isLoggedInAuth$ updated by AuthService:', loggedIn);
      this.logCartVisibilityInfo(); // Llama a la función de log cuando el estado de login cambia
    });

    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });

    this.authService.sucursales$.subscribe(sucursales => {
      this.sucursales = sucursales;
    });

    // authService.initAuthFromStorage() es llamado en el constructor de AuthService.
    // No es necesario llamarlo aquí de nuevo.

    this.verificarSesion();
    this.isHome = this.router.url === '/auth/home';

    this.selectedSucursal = localStorage.getItem('selectedSucursal')
      ? JSON.parse(localStorage.getItem('selectedSucursal') as string)
      : null;

    this.asesor = localStorage.getItem('asesor') || '';
    this.authService.disponible$.subscribe(valor => {
      this.disponible = valor;
    });

    this.authService.dias$.subscribe(dias => {
      if (dias === 0) {
        this.authService.mostrarDialogo('NO PUEDES REALIZAR PEDIDOS EN ESTA SUCURSAL PORQUE LA CARTERA NO ESTA AL DÍA.');
        this.router.navigate(['/auth/home']);
      }
    });

    this.authService.mostrarDialogo$.subscribe(mensaje => {
      this.dialog.open(DialogComponent, {
        data: { message: mensaje },
        width: '400px',
        maxWidth: '90vw',
        position: {
          top: '30vh',
        },
        panelClass: 'alert-dialog-container',
        disableClose: true,
        autoFocus: true
      });
    });

    this.totalItems$ = this.cartService.totalItems$; // Asegúrate de que getTotalItems es el método que retorna Observable
    this.cartItemsSubscription = this.totalItems$.subscribe(totalItems => {
      this.mostrarSelectorSucursal = totalItems === 0;
    });
  }
  ngOnDestroy(): void {
    if (this.cartItemsSubscription) {
      this.cartItemsSubscription.unsubscribe();
    }
  }

  get selectedSucursalNombre(): string | null {
    const sucursal = this.sucursales.find(s => s.sucursal === this.selectedSucursal);
    return sucursal ? `${sucursal.sucursal} - ${sucursal.nombre_sucursal}` : null;
  }

  obtenerSucursales() {
    const nit = localStorage.getItem('nit');

    if (nit) {
      const nitParsed = JSON.parse(nit);
      this.authService.getSucursales(nitParsed).subscribe({
        next: (data) => {
          this.sucursales = data;
        }, 
        error: (err) => {
          console.error('Error al obtener sucursales:', err);
        }
      });
    } else {
      console.error('⚠️ No se encontraron sucursales para el nit');
    }
  }

  verificarSesion() { 
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/auth/login']);
    }
  }

  cerrarSesion() { 
    localStorage.removeItem('usuario');
    localStorage.removeItem('nit');
    localStorage.removeItem('selectedSucursal');
    localStorage.removeItem('asesor');
    localStorage.removeItem('token');
    this.usuario = {};
    this.sucursales = [];
    this.selectedSucursal = null;
    this.asesor = '';
    this.cupo = 0;
    this.router.navigate(['/auth/login']);
  } 

  onSucursalChange() {
  if (this.selectedSucursal) {
    const selectedSucursalData = this.sucursales.find(
      suc => suc.sucursal === this.selectedSucursal
    );

    if (selectedSucursalData) {
      this.asesor = selectedSucursalData.asesor;
      this.id = selectedSucursalData.id_cliente;
      this.sharedDataService.setUsuario(selectedSucursalData.usuario);
      this.sharedDataService.setListaPrecio(selectedSucursalData.listaprecio);
      this.authService.setDisponible(selectedSucursalData.disponible);
      this.authService.setDias(selectedSucursalData.dias);
      this.sharedDataService.emitSucursalChange(selectedSucursalData);
      localStorage.setItem('selectedSucursal', JSON.stringify(selectedSucursalData));  
      localStorage.setItem('asesor', this.asesor); 
      localStorage.setItem('id_cliente', selectedSucursalData.id_cliente);
    }
  }
} 

  goToHome() {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      this.router.navigate(['/auth/home'])
    } else {
      this.router.navigate(['/auth/login'])
    }
  }

   shouldShowCart(): boolean {
   const isNotVendorOrSupervisor = !this.authService.esUsuarioConPerfil(['VENDEDOR', 'SUPERVISOR']);
    const isCurrentlyLoggedIn = this.authService['_isLoggedIn'].getValue();
    return isCurrentlyLoggedIn && isNotVendorOrSupervisor;
  }
 
   logCartVisibilityInfo(): void {
    const perfilActual = this.authService.getPerfilUsuario();
    const isVendorOrSupervisor = this.authService.esUsuarioConPerfil(['VENDEDOR', 'SUPERVISOR']);
    const currentIsLogin = this.authService['_isLoggedIn'].getValue(); // <-- Obtiene el valor real de _isLoggedIn

    console.log('--- Carrito Visibilidad Info ---');
    console.log('isLogin (from AuthService):', currentIsLogin); // Cambiado para aclarar la fuente
    console.log('Perfil Actual:', perfilActual);
    console.log('Es Vendedor/Supervisor:', isVendorOrSupervisor);
    console.log('Resultado shouldShowCart():', this.shouldShowCart());
    console.log('------------------------------');
  }

} 