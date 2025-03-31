// import { Injectable } from '@angular/core';
// import { CanActivate, Router } from '@angular/router';
// import { SharedService } from '../shared/shared.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class DiasGuard implements CanActivate {
//   constructor(private sharedService: SharedService, private router: Router) {}

//   async canActivate(): Promise<boolean> {
//     console.log('🛑 Ejecutando el Guard antes de entrar a PedidosComponent...');
  
//     try {
//       const dias = await this.sharedService.obtenerDias();
//       console.log('🔍 Días en el Guard:', dias);
      
//       if (dias === 0) {
//         console.warn('🚨 Acceso bloqueado: Redirigiendo al home...');
//         this.router.navigate(['/auth/home']);
//         return false;
//       }
    
//       console.log('✅ Acceso permitido a PedidosComponent.');
//       return true;
//     } catch (error) {
//       console.error('❌ Error obteniendo días:', error);
//       this.router.navigate(['/auth/home']);
//       return false;
//     }
//   }
  
// }
