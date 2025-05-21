import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, interval, map, Observable, of, Subscription, catchError, BehaviorSubject, Subject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environments.prod';
import { Usuario } from '../models/usuario';
import { Sucursal } from '../models/sucursal';

@Injectable({
  providedIn: 'root'
})


export class AuthService {
  private baseUrl = environment.apiBaseUrl;
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  usuario$ = this.usuarioSubject.asObservable();

  private sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
  sucursales$ = this.sucursalesSubject.asObservable();

  private endpoints = {
    login: '/login.php',
    sucursal: '/sucursal_cupo.php',
    refresh: '/proteger.php',
  };

  private inactivityTime = 10 * 60 * 1000;
  private lastActivity: number = Date.now();
  private tokenCheckInterval: number = 60000; // Intervalo para verificar el token (1 minuto)
  private tokenValidationSubscription: Subscription | undefined;

  private disponibleSubject = new BehaviorSubject<number>(0);
  disponible$ = this.disponibleSubject.asObservable();

  setDisponible(valor: number) {
    console.log('Disponible en autService setDisponible:', valor);
    this.disponibleSubject.next(valor);
  }

  private mostrarDialogoSubject = new Subject<string>();
  mostrarDialogo$ = this.mostrarDialogoSubject.asObservable();

  private diasSubject = new BehaviorSubject<number>(0);
  dias$ = this.diasSubject.asObservable();

  mostrarDialogo(mensaje: string) {
    this.mostrarDialogoSubject.next(mensaje);
  }

  setDias(valor: number) {
    console.log('>>> Llamando setDias con valor:', valor); // Confirma que se llama
    this.diasSubject.next(valor);
    console.log('>>> diasSubject emitió el valor:', valor); // Confirma la emisión
  }

 

  constructor(private http: HttpClient, private router: Router) {
    this.detectarActividad();
    this.startTokenValidation();
  }

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  login(usuario: string, clave: string): Observable<{ success: boolean; usuario: Usuario; token: string }> {
    return this.http.post<{ success: boolean; usuario: Usuario; token: string }>(
      this.getUrl(this.endpoints.login), 
      { usuario, clave }
    );
  }

  getSucursales(nit: string): Observable<Sucursal[]> {
    return this.http.post<Sucursal[]>(this.getUrl(this.endpoints.sucursal), { nit });
  } 


  obtenerUsuarioDesdeStorage() {
    const usuarioStorage = localStorage.getItem('usuario');
    if (usuarioStorage) {
        const usuario = JSON.parse(usuarioStorage);
        this.usuarioSubject.next(usuario); 
        this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {             
            this.sucursalesSubject.next(sucursales);
            console.log('sucursales obtenidas', sucursales);

            if (sucursales.length > 0) {
                const sucursalSelect = sucursales[0];
                this.setDisponible(sucursalSelect.disponible); 
                localStorage.setItem('selectedSucursal', JSON.stringify(sucursalSelect));
                console.log('disponible en el servicio obtenerUsuario', sucursalSelect.disponible);

            }
        });
    }
}

  guardarSesion(token: string, usuario: Usuario) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
    this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {
      this.sucursalesSubject.next(sucursales); // Notifica a HeaderComponent
    });
    this.lastActivity = Date.now();
    this.startTokenValidation();
  }

  decodificarToken(): any | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      console.log('Error al decodificar el token', error);
      return null;
    }
  }

  getSucursalSeleccionada(): Sucursal | null {
  const data = localStorage.getItem('selectedSucursal');
  return data ? JSON.parse(data) : null;
}


  private getTokenExpiration(): number | null{
    const tokenDecodificado = this.decodificarToken();
    return tokenDecodificado ? tokenDecodificado.exp * 1000 : null;
  }

  esTokenValido(): boolean {
    const exp = this.getTokenExpiration();
    console.log('Verificando validez del token, expira en:', exp ? (exp - Date.now()) / 1000 : 'Token no válido');
    return exp ?  Date.now() < exp : false;
}


  refrescarToken(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log("No hay token en localStorage, cerrando sesión...");
      this.logout();
      return of(null);
    }

    console.log("Enviando solicitud para refrescar token a:", this.getUrl(this.endpoints.refresh));
    console.log("Token enviado:", localStorage.getItem('token'));

    return this.http.get(this.getUrl(this.endpoints.refresh), {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map((response: any) => {
        console.log("Respuesta de refresco de token:", response);
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
          this.lastActivity = Date.now();
          return response;
        } else {
          console.log("No se recibió un nuevo token, cerrando sesión...");
          this.logout();
          return null;
        }
      }),
      catchError((error) => {
        console.error('Error al refrescar token:', error);
        this.logout();
        return of(null);
      })
    );
  }


  startTokenValidation() {
    if (this.tokenValidationSubscription) {
      this.tokenValidationSubscription.unsubscribe(); 
    }

    this.tokenValidationSubscription = interval(this.tokenCheckInterval).subscribe(() => {
      if (!localStorage.getItem('token')) {
        this.stopTokenValidation();
        return;
      }

      const inactiveTime = Date.now() - this.lastActivity;
      const tokenExpiration = this.getTokenExpiration();
      const timeLeft = tokenExpiration ? tokenExpiration - Date.now() : 0;


      console.log(`Tiempo inactivo: ${inactiveTime / 1000} segundos, Tiempo restante del token: ${timeLeft/1000} segundos`);

      if (inactiveTime > this.inactivityTime || (timeLeft > 0 && timeLeft < 5 * 60 * 1000) || !this.esTokenValido()) { // 5 minutos de anticipación
          console.log('Refrescando token por inactividad o proximidad a expiración');
          this.refrescarToken().subscribe(response => {
              if (!response || !this.esTokenValido()) {
                  console.log('No se pudo refrescar el token o sigue inválido, cerrando sesión');
                  this.logout();
              }
          });
      } else {
          console.log('No es necesario refrescar el token aún.');
      }
    });
  }

  stopTokenValidation() {
    if (this.tokenValidationSubscription) {
      this.tokenValidationSubscription.unsubscribe();
      this.tokenValidationSubscription = undefined;
    }
  }


  detectarActividad() {
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    eventos.forEach(evento => {
      fromEvent(document, evento).subscribe(() => {
        this.lastActivity = Date.now();
      });
    });
  }

  logout() {
    this.stopTokenValidation();
    localStorage.clear();
    this.router.navigate(['/login']);
  } 
   
}


// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { fromEvent, interval, map, Observable, of, Subscription, catchError, BehaviorSubject, tap, throwError } from 'rxjs';
// import { jwtDecode } from 'jwt-decode';
// import { Router } from '@angular/router';
// import { environment } from 'src/environments/environments.prod';
// import { Usuario } from '../models/usuario';
// import { Sucursal } from '../models/sucursal';

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private baseUrl = environment.apiBaseUrl;
//   private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
//   usuario$ = this.usuarioSubject.asObservable();

//   private sucursalesSubject = new BehaviorSubject<Sucursal[]>([]);
//   sucursales$ = this.sucursalesSubject.asObservable();

//   private endpoints = {
//     login: '/login.php',
//     sucursal: '/sucursal_cupo.php',
//     // sucursal: '/cliente_sucursal.php',
//     refresh: '/proteger.php',
//    // cupo: '/cupo_cliente.php'
//   };

//   private inactivityTime = 10 * 60 * 1000;
//   private lastActivity: number = Date.now();
//   private tokenCheckInterval: number = 60000; // Intervalo para verificar el token (1 minuto)
//   private tokenValidationSubscription: Subscription | undefined;


//   constructor(private http: HttpClient, private router: Router) {
//     this.detectarActividad();
//     this.startTokenValidation();
//   }

//   private getUrl(endpoint: string): string {
//     return `${this.baseUrl}${endpoint}`;
//   }

//   login(usuario: string, clave: string): Observable<{ success: boolean; usuario: Usuario; token: string }> {
//     return this.http.post<{ success: boolean; usuario: Usuario; token: string }>(
//       this.getUrl(this.endpoints.login), 
//       { usuario, clave }
//     );
//   }

//   getSucursales(nit: string): Observable<Sucursal[]> {
//     return this.http.post<Sucursal[]>(this.getUrl(this.endpoints.sucursal), { nit });
//   } 

//   obtenerUsuarioDesdeStorage() {
//     const usuarioStorage = localStorage.getItem('usuario');
//     if (usuarioStorage) {
//         const usuario = JSON.parse(usuarioStorage);
//         this.usuarioSubject.next(usuario); 
//         this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {             
//             this.sucursalesSubject.next(sucursales);
//             console.log('surcursales', this.sucursalesSubject) //  Notifica a los componentes
//         });
//     }
// }


//   guardarSesion(token: string, usuario: Usuario) {
//     localStorage.setItem('token', token);
//     localStorage.setItem('usuario', JSON.stringify(usuario));
//     this.usuarioSubject.next(usuario);
//     this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {
//       this.sucursalesSubject.next(sucursales); // Notifica a HeaderComponent
//     });
//     this.lastActivity = Date.now();
//     this.startTokenValidation();
//   }

//   decodificarToken(): any | null {
//     const token = localStorage.getItem('token');
//     if (!token) return null;
//     try {
//       return jwtDecode(token);
//     } catch (error) {
//       console.log('Error al decodificar el token', error);
//       return null;
//     }
//   }


//   private getTokenExpiration(): number | null{
//     const tokenDecodificado = this.decodificarToken();
//     return tokenDecodificado ? tokenDecodificado.exp * 1000 : null;
//   }

//   esTokenValido(): boolean {
//     const exp = this.getTokenExpiration();
//     console.log('Verificando validez del token, expira en:', exp ? (exp - Date.now()) / 1000 : 'Token no válido');
//     return exp ?  Date.now() < exp : false;
// }


//   refrescarToken(): Observable<any> {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       console.log("No hay token en localStorage, cerrando sesión...");
//       this.logout();
//       return of(null);
//     }

//     console.log("Enviando solicitud para refrescar token a:", this.getUrl(this.endpoints.refresh));
//     console.log("Token enviado:", localStorage.getItem('token'));

//     return this.http.get(this.getUrl(this.endpoints.refresh), {
//       headers: { Authorization: `Bearer ${token}` }
//     }).pipe(
//       map((response: any) => {
//         console.log("Respuesta de refresco de token:", response);
//         if (response.success && response.token) {
//           localStorage.setItem('token', response.token);
//           this.lastActivity = Date.now();
//           return response;
//         } else {
//           console.log("No se recibió un nuevo token, cerrando sesión...");
//           this.logout();
//           return null;
//         }
//       }),
//       catchError((error) => {
//         console.error('Error al refrescar token:', error);
//         this.logout();
//         return of(null);
//       })
//     );
//   }


//   startTokenValidation() {
//     if (this.tokenValidationSubscription) {
//       this.tokenValidationSubscription.unsubscribe(); 
//     }

//     this.tokenValidationSubscription = interval(this.tokenCheckInterval).subscribe(() => {
//       if (!localStorage.getItem('token')) {
//         this.stopTokenValidation();
//         return;
//       }

//       const inactiveTime = Date.now() - this.lastActivity;
//       const tokenExpiration = this.getTokenExpiration();
//       const timeLeft = tokenExpiration ? tokenExpiration - Date.now() : 0;


//       console.log(`Tiempo inactivo: ${inactiveTime / 1000} segundos, Tiempo restante del token: ${timeLeft/1000} segundos`);

//       if (inactiveTime > this.inactivityTime || (timeLeft > 0 && timeLeft < 5 * 60 * 1000) || !this.esTokenValido()) { // 5 minutos de anticipación
//           console.log('Refrescando token por inactividad o proximidad a expiración');
//           this.refrescarToken().subscribe(response => {
//               if (!response || !this.esTokenValido()) {
//                   console.log('No se pudo refrescar el token o sigue inválido, cerrando sesión');
//                   this.logout();
//               }
//           });
//       } else {
//           console.log('No es necesario refrescar el token aún.');
//       }
//     });
//   }

//   stopTokenValidation() {
//     if (this.tokenValidationSubscription) {
//       this.tokenValidationSubscription.unsubscribe();
//       this.tokenValidationSubscription = undefined;
//     }
//   }


//   detectarActividad() {
//     const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
//     eventos.forEach(evento => {
//       fromEvent(document, evento).subscribe(() => {
//         this.lastActivity = Date.now();
//       });
//     });
//   }

//   logout() {
//     this.stopTokenValidation();
//     localStorage.clear();
//     this.router.navigate(['/login']);
//   } 
   
// }


