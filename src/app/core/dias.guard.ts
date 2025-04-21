import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { DialogComponent } from '../shared/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class DiasGuard implements CanActivate {
  constructor(
            private authService: AuthService, 
            private router: Router,
            private dialog: MatDialog
          ) {}

          canActivate(): Observable<boolean> {
            return this.authService.dias$.pipe(
              take(1),
              map(dias => {
                console.log('Valor de días en Guard:', dias);
                if (dias === 0) {
                  console.log('Días es 0, mostrando diálogo');
                  this.authService.mostrarDialogo('No puedes realizar pedidos porque la cartera no está al día.');
                  setTimeout(() => {
                    this.router.navigate(['/auth/home']);
                  }, 3000); 
                  return false;
                }
                return true;
              })
            );
          }
                   

}
