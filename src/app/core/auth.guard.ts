// src/app/core/auth.guard.ts (o donde tengas tu AuthGuard)

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Asegúrate de que la ruta sea correcta
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router){}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const tokenValido = this.authService.esTokenValido();
    const perfilUsuario = this.authService.getPerfilUsuario();
   
    const perfilesPermitidos = route.data['roles'] as string[]; 

    if (tokenValido && perfilUsuario) {
      if (perfilesPermitidos && perfilesPermitidos.length > 0) {
        if (this.authService.esUsuarioConPerfil(perfilesPermitidos)) {
          return true; // Token válido y perfil(es) autorizado(s)
        } else {
           Swal.fire({
                      icon: 'error',
                      iconColor: '#b71c1c', 
                      title: 'Error',
                      text: 'No tienes permiso para este modulo',
                      background: '#2c2c2c',
                      color: '#ffffff',
                      confirmButtonColor: '#b71c1c', 
                      confirmButtonText: 'Intentar de nuevo',
                    });
          return this.router.createUrlTree(['/auth/home']); 
        }
      } else {
        return true;
      }
    } else {
      this.authService.logout();
      return this.router.createUrlTree(['/auth/home']);
    }
  }
}