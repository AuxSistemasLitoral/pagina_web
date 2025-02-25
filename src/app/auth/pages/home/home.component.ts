import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  usuario: any = {};
  menuAbierto: boolean = false; 
  sucursales: any[] = [];

  constructor(
    private router: Router,
    private authService: AuthService ){}

  ngOnInit(){    
    this.ontenerUsuario();
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
  

  ontenerUsuario(){
    const usuarioG = localStorage.getItem('usuario');
    if(usuarioG){
      this.usuario = JSON.parse(usuarioG);
    }else{
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
