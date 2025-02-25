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
            timer: 2000,
            showConfirmButton: true
          });
          localStorage.setItem('token', response.token);
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
          localStorage.setItem('nit', JSON.stringify(response.usuario.cedula.toString()));
          this.router.navigate(['/auth/home']);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Credenciales inválidas',
            background: '#222',
            color: '#fff',
            confirmButtonColor: '#ff5733',
          });
        }
      },
      error: (error) => {
        console.error('Error en login', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al iniciar sesión'
        });
      }
    });
  }



}
