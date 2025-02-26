import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  usuario: any = {};
  menuAbierto: boolean = false; 
  sucursales: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService ){}

  ngOnInit(){    
    this.obtenerUsuario();
    this.verificarSesion();
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

}
