import { Component, ChangeDetectorRef  } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth.service';
import { SharedDataService } from '../../core/shared-data.service';
import { environment } from 'src/environments/environments.prod';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  private baseUrl = environment.apiBaseUrl;
  home = this.baseUrl + '/auth/home';
  usuario: any = {};
  menuAbierto: boolean = false; 
  sucursales: any[] = [];
  isHome: boolean = false;
  selectedSucursal: any | null = null;
  asesor: string = '';
  isLogin: boolean = false;

  id: string = '';
  cupo: number = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sharedDataService: SharedDataService,
    private cdRef: ChangeDetectorRef ){}

  // ngOnInit(){
  //   this.obtenerUsuario();
  //   this.obtenerSucursales();
  //   this.verificarSesion();
  //   this.isHome = this.router.url === '/auth/home';   

  //   this.router.events.subscribe(() => {
  //     this.isLogin = this.router.url === '/auth/login'; 

  // });

  //   this.selectedSucursal = localStorage.getItem('selectedSucursal') 
  //   ? JSON.parse(localStorage.getItem('selectedSucursal') as string) 
  //   : null;
    
  // }   

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
    });

    // Mantener la sucursal seleccionada si ya había una en localStorage
    this.selectedSucursal = localStorage.getItem('selectedSucursal') 
        ? JSON.parse(localStorage.getItem('selectedSucursal') as string) 
        : null;
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
    
    this.usuario = {}; 
    this.sucursales = [];
    this.selectedSucursal = null;
    this.asesor = '';
    this.cupo = 0;

    this.router.navigate(['/auth/login']);
    this.cdRef.detectChanges(); 
}


  toggleMenu(){
    this.menuAbierto = !this.menuAbierto;
  }

  onSucursalChange(event: Event) {
    console.log('Entró a onSucursalChange');
    const selectedSucursalId = (event.target as HTMLSelectElement).value;
    console.log('ID sucursal seleccionada:', selectedSucursalId);
    const selectedSucursal = this.sucursales.find(suc => suc.sucursal === selectedSucursalId);
  
    if (selectedSucursal) {
      this.asesor = selectedSucursal.asesor;     
      this.id = selectedSucursal.id_cliente;
      const usuario = selectedSucursal.usuario;
      const listaprecio = selectedSucursal.listaprecio;
      this.sharedDataService.setUsuario(usuario);
      this.sharedDataService.setListaPrecio(listaprecio);
      console.log('Vendedor seleccionado:', this.asesor, 'el id del cliente', this.id);
      console.log('Datos guardados en el servicio:', usuario, listaprecio);
      this.sharedDataService.notifyDataReady();
       
      this.authService.obtenerCupo(this.id).subscribe( 
        (response)=> {
          if(response && response.cupo !== undefined){
            this.cupo = response.cupo;
            console.log('cupo para el cliente', this.cupo);
          }else{
            console.log('el cliente no tiene cupo');
          }
        },
        (error)=> {
          console.error('error obtiendo el cupo', error);
        }
      )
    }
  }

  goToHome(){
    const usuario = localStorage.getItem('usuario');
    if(usuario){
      this.router.navigate(['/auth/home'])
    }else{
      this.router.navigate(['/auth/login'])
    }
  }


  

  
}
