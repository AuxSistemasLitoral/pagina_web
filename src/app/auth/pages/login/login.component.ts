import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario: string = '';
  clave: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  login() {
    this.authService.login(this.usuario, this.clave).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);

        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Ingreso exitoso',
            text: 'Bienvenido a nuestro portal web',
            timer: 1500,
            showConfirmButton: true,
            background: '#1e1e1e',
            color: '#ffffff',
            confirmButtonColor: '#4caf50',
            confirmButtonText: '¡Genial!',
          });
          this.authService.guardarSesion(response.token, response.usuario);
          localStorage.setItem('nit', JSON.stringify(response.usuario.cedula.toString()));
          const TokenDecodificado = this.authService.decodificarToken();
           console.log('token dedodificado',TokenDecodificado);
          this.router.navigate(['/auth/home']);
        } else {
          Swal.fire({
            icon: 'error',
            iconColor: '#b71c1c', // Rojo más oscuro
            title: 'Error',
            text: 'Credenciales inválidas',
            background: '#2c2c2c',
            color: '#ffffff',
            confirmButtonColor: '#b71c1c', // Rojo más oscuro
            confirmButtonText: 'Intentar de nuevo',
          });
        }
      },
      error: (error) => {
        console.error('Error en login', error);
        Swal.fire({
          icon: 'error',
          iconColor: '#b71c1c', // Rojo más oscuro
          title: 'Error',
          text: 'Ocurrió un error al iniciar sesión',
          background: '#2c2c2c',
          color: '#ffffff',
          confirmButtonColor: '#b71c1c', // Rojo más oscuro
          confirmButtonText: 'Intentar de nuevo',
        });
      }
    });
  }
}