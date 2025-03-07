import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth.service';
import { SharedDataService } from '../../core/shared-data.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  usuario: any = {};
  menuAbierto: boolean = false; 
  sucursales: any[] = [];
  isHome: boolean = false;
  selectedSucursal: any;
  asesor: string = '';

  id: string = '';
  cupo: number = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sharedDataService: SharedDataService ){}

  ngOnInit(){    
    this.obtenerUsuario();
    this.verificarSesion();
    this.isHome = this.router.url === '/auth/home';
    const nit = localStorage.getItem('nit');   

    if(nit){
      const nitParsed = JSON.parse(nit);
      console.log('nit obtenido', nitParsed);

      this.authService.getSucursales(nitParsed).subscribe({
        next: (data) => {
          this.sucursales = data;
          console.log('Sucursales obtenidas:', this.sucursales);
        },
        error: (err) => {
          console.error('Error al obtener sucursales:', err);
        }
      });
      
    }else{
      console.error('No se encontraron sucursales para el nit');
    }
  }   

  obtenerUsuario() {
    const usuarioG = localStorage.getItem('usuario');
    
    if (usuarioG) {
      try {
        this.usuario = JSON.parse(usuarioG);
      } catch (error) {
        console.error("Error al parsear el usuario:", error);
        this.router.navigate(['/auth/login']);
      }
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  verificarSesion() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/auth/login']);
    }
  } 

  
  cerrarSesion(){
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/auth/login']);
  }

  toggleMenu(){
    this.menuAbierto = !this.menuAbierto;
  }

  onSucursalChange(event: Event) {
    console.log('Entró a onSucursalChange');
    const selectedSucursalId = (event.target as HTMLSelectElement).value;
    console.log('ID sucursal seleccionada:', selectedSucursalId);
  
    // Buscar la sucursal seleccionada en la lista de sucursales
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


  

  
}
