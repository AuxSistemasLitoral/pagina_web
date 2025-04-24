import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth.service';
import { SharedDataService } from '../../core/shared-data.service';
import { environment } from 'src/environments/environments.prod';
import { SharedService } from '../shared.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { Observable } from 'rxjs';
import { ShoppingCartService } from 'src/app/core/shopping-cart.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  private baseUrl = environment.apiBaseUrl;
  home = this.baseUrl + '/auth/home';
  usuario: any = {};
  sucursales: any[] = [];
  isHome: boolean = false;
  selectedSucursal: any | null = null;
  asesor: string = '';
  isLogin: boolean = false;
  dias: number = 0;
  id: string = '';
  cupo: number | null = null;
  disponible: number = 0;
  totalItems$!: Observable<number>;


  constructor(
    private router: Router,
    private authService: AuthService,
    private sharedDataService: SharedDataService,
    private cdRef: ChangeDetectorRef,
    private sharedService: SharedService,
    private dialog: MatDialog,
    private cartService: ShoppingCartService
  ) { }


  ngOnInit() {
    //  Escuchar cambios en el usuario y actualizar automáticamente
    this.authService.usuario$.subscribe(usuario => {
      this.usuario = usuario;
    });

    // Escuchar cambios en las sucursales y actualizar automáticamente
    this.authService.sucursales$.subscribe(sucursales => {
      this.sucursales = sucursales;
    });

    //  Verificar si el usuario ya está autenticado (ejemplo: después de un refresh)
    this.authService.obtenerUsuarioDesdeStorage();

    this.verificarSesion();
    this.isHome = this.router.url === '/auth/home';

    this.router.events.subscribe(() => {
      this.isLogin = this.router.url === '/auth/login';
      this.cdRef.detectChanges();
    });

    // Mantener la sucursal seleccionada si ya había una en localStorage
    this.selectedSucursal = localStorage.getItem('selectedSucursal')
      ? JSON.parse(localStorage.getItem('selectedSucursal') as string)
      : null;

    this.authService.disponible$.subscribe(valor => {
      this.disponible = valor;
      console.log('Disponible en HeaderComponent:', valor);
    });

    this.authService.dias$.subscribe(dias => {
      console.log('Cambio en días:', dias);
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

    this.totalItems$ = this.cartService.totalItems$;
  }

  obtenerSucursales() {
    const nit = localStorage.getItem('nit');

    if (nit) {
      const nitParsed = JSON.parse(nit);
      this.authService.getSucursales(nitParsed).subscribe({
        next: (data) => {
          this.sucursales = data;
          console.log('✅ Sucursales obtenidas:', this.sucursales);
          this.cdRef.detectChanges();
        },
        error: (err) => {
          console.error('Error al obtener sucursales:', err);
        }
      });
    } else {
      console.error('⚠️ No se encontraron sucursales para el nit');
    }
  }

  obtenerUsuario() {
    const usuarioStorage = localStorage.getItem('usuario');
    if (usuarioStorage) {
      this.usuario = JSON.parse(usuarioStorage);
      this.cdRef.detectChanges();
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
    localStorage.removeItem('token');
    this.usuario = {};
    this.sucursales = [];
    this.selectedSucursal = null;
    this.asesor = '';
    this.cupo = 0;
    this.router.navigate(['/auth/login']);
    this.cdRef.detectChanges();
  }


  onSucursalChange() {
    if (this.selectedSucursal) {
      const selectedSucursalData = this.sucursales.find(suc => suc.sucursal === this.selectedSucursal);

      if (selectedSucursalData) {
        this.asesor = selectedSucursalData.asesor;
        this.id = selectedSucursalData.id_cliente;
        this.sharedDataService.setUsuario(selectedSucursalData.usuario);
        this.sharedDataService.setListaPrecio(selectedSucursalData.listaprecio);
        this.authService.setDisponible(selectedSucursalData.disponible);
        this.authService.setDias(selectedSucursalData.dias);
        localStorage.setItem('selectedSucursal', JSON.stringify(this.selectedSucursal));
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

}