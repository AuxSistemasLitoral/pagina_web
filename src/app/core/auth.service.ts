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
    //console.log('Disponible en autService setDisponible:', valor);
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
    //console.log('>>> Llamando setDias con valor:', valor); // Confirma que se llama
    this.diasSubject.next(valor);
    //console.log('>>> diasSubject emitió el valor:', valor); // Confirma la emisión
  }

  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$: Observable<boolean> = this._isLoggedIn.asObservable();
 // private _isLoggedIn = new BehaviorSubject<boolean>(this.hasValidToken());
 // isLoggedIn$: Observable<boolean> = this._isLoggedIn.asObservable();
  private tokenKey = 'token';
  private userKey = 'usuario';

  constructor(private http: HttpClient, private router: Router) {
    this.initAuthFromStorage(); 
    //this.obtenerUsuarioDesdeStorage();
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
    ).pipe(
      map(response => {
        if (response.success && response.token && response.usuario) {
          this.guardarSesion(response.token, response.usuario); // Guardar sesión y emitir estados
          return response;
        }
        throw new Error('Login fallido: no se recibió token o usuario.');
      })
    );
  }

   private initAuthFromStorage(): void {
    const usuarioStorage = localStorage.getItem(this.userKey);
    const token = localStorage.getItem(this.tokenKey);

    if (usuarioStorage && token && this.hasValidToken()) { // Reutiliza hasValidToken() correctamente
      try {
        const usuario = JSON.parse(usuarioStorage);
        this.usuarioSubject.next(usuario); // Establece el usuario
        this._isLoggedIn.next(true); // Marca como logueado
        
        // Obtener sucursales si el usuario tiene cédula (puede ser asíncrono)
        if (usuario.cedula) {
          this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {
            this.sucursalesSubject.next(sucursales);
            if (sucursales.length > 0) {
              const sucursalSelect = sucursales[0];
              this.setDisponible(sucursalSelect.disponible);
              localStorage.setItem('selectedSucursal', JSON.stringify(sucursalSelect));
            }
          });
        }
      } catch (e) {
        console.error('Error al parsear usuario desde localStorage o token inválido', e);
        this.clearAuthDataAndLogout(); // Limpiar y desloguear si hay error de parseo o token inválido
      }
    } else {
      this.clearAuthDataAndLogout(); // Limpiar y desloguear si no hay usuario o token válido
    }
  }


   private clearAuthDataAndLogout(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('selectedSucursal'); // Limpiar también esto si lo manejas aquí
    this.usuarioSubject.next(null);
    this.sucursalesSubject.next([]);
    this._isLoggedIn.next(false);
  }

  getSucursales(nit: string): Observable<Sucursal[]> {
    return this.http.post<Sucursal[]>(this.getUrl(this.endpoints.sucursal), { nit });
  }

  obtenerUsuarioDesdeStorage() {
    const usuarioStorage = localStorage.getItem(this.userKey);
    const token = localStorage.getItem(this.tokenKey); // También lee el token
    
    if (usuarioStorage && token && this.hasValidToken()) { // **** IMPORTANTE: Verifica token y usuario ****
      try {
        const usuario = JSON.parse(usuarioStorage);
        this.usuarioSubject.next(usuario); // Emite el usuario cargado
        this._isLoggedIn.next(true); // **** AQUI: Si hay usuario y token válido, marca como logueado ****

        if (usuario.cedula) {
          this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {
            this.sucursalesSubject.next(sucursales);
            if (sucursales.length > 0) {
              const sucursalSelect = sucursales[0];
              this.setDisponible(sucursalSelect.disponible);
              localStorage.setItem('selectedSucursal', JSON.stringify(sucursalSelect));
            }
          });
        }
      } catch (e) {
        console.error('Error al parsear usuario desde localStorage o token inválido', e);
        this.logout(); // Si el JSON está corrupto o token inválido, cerrar sesión
      }
    } else {
        this.usuarioSubject.next(null); // No hay usuario en storage
        this.sucursalesSubject.next([]); // No hay sucursales
        this._isLoggedIn.next(false); // **** AQUI: Asegura que el estado es falso si no hay sesión ****
        localStorage.removeItem(this.userKey); // Limpiar si algo está inconsistente
        localStorage.removeItem(this.tokenKey);
    }
  }

  // obtenerUsuarioDesdeStorage() {
  //   const usuarioStorage = localStorage.getItem('usuario');
  //   if (usuarioStorage) {
  //     const usuario = JSON.parse(usuarioStorage);
  //     this.usuarioSubject.next(usuario);
  //     this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {
  //       this.sucursalesSubject.next(sucursales);
  //       // console.log('sucursales obtenidas', sucursales);

  //       if (sucursales.length > 0) {
  //         const sucursalSelect = sucursales[0];
  //         this.setDisponible(sucursalSelect.disponible);
  //         localStorage.setItem('selectedSucursal', JSON.stringify(sucursalSelect));
  //         //console.log('disponible en el servicio obtenerUsuario', sucursalSelect.disponible);

  //       }
  //     });
  //   }
  // }

  esUsuarioConPerfil(perfilRequerido: string | string[]): boolean {
    const perfilActual = this.getPerfilUsuario();
    if (!perfilActual) {
      return false;
    }

    if (Array.isArray(perfilRequerido)) {
      return perfilRequerido.includes(perfilActual);
    } else {
      return perfilActual === perfilRequerido;
    }
  }

  getPerfilUsuario(): string | null {
    const usuario = this.usuarioSubject.getValue();
    return usuario ? usuario.perfil_id : null;
  }

  guardarSesion(token: string, usuario: Usuario) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(usuario));
    this.usuarioSubject.next(usuario); // Notifica a los suscriptores del usuario
    this._isLoggedIn.next(true); // **** ESTO ES CRÍTICO: Notifica que el usuario está logueado ****

    // Asegúrate de obtener las sucursales aquí también después de un login exitoso
    // Si usuario.cedula existe, es un buen lugar para obtener las sucursales
    if (usuario.cedula) {
      this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {
        this.sucursalesSubject.next(sucursales);
        if (sucursales.length > 0) {
          const sucursalSelect = sucursales[0];
          this.setDisponible(sucursalSelect.disponible);
          localStorage.setItem('selectedSucursal', JSON.stringify(sucursalSelect));
        }
      });
    }

    this.lastActivity = Date.now();
    this.startTokenValidation();
  }

  decodificarToken(): any | null {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      return null;
    }
  }
  // guardarSesion(token: string, usuario: Usuario) {
  //   localStorage.setItem('token', token);
  //   localStorage.setItem('usuario', JSON.stringify(usuario));
  //   this.usuarioSubject.next(usuario);
  //   this.getSucursales(usuario.cedula.toString()).subscribe(sucursales => {
  //     this.sucursalesSubject.next(sucursales); // Notifica a HeaderComponent
  //   });
  //   this.lastActivity = Date.now();
  //   this.startTokenValidation();
  // }

  // decodificarToken(): any | null {
  //   const token = localStorage.getItem('token');
  //   if (!token) return null;
  //   try {
  //     return jwtDecode(token);
  //   } catch (error) {
  //     //  console.log('Error al decodificar el token', error);
  //     return null;
  //   }
  // }

  getSucursalSeleccionada(): Sucursal | null {
    const data = localStorage.getItem('selectedSucursal');
    return data ? JSON.parse(data) : null;
  }


  private getTokenExpiration(): number | null {
    const tokenDecodificado = this.decodificarToken();
    return tokenDecodificado ? tokenDecodificado.exp * 1000 : null;
  }

  esTokenValido(): boolean {
    const exp = this.getTokenExpiration();
    // console.log('Verificando validez del token, expira en:', exp ? (exp - Date.now()) / 1000 : 'Token no válido');
    return exp ? Date.now() < exp : false;
  }

  hasValidToken(): boolean {
    const exp = this.getTokenExpiration();
    return exp ? Date.now() < exp : false;
  }

  refrescarToken(): Observable<any> {
    const token = localStorage.getItem(this.tokenKey);
    if (!token) {
      this.logout();
      return of(null);
    }

    return this.http.get(this.getUrl(this.endpoints.refresh), {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map((response: any) => {
        if (response.success && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          this.lastActivity = Date.now();
          this._isLoggedIn.next(true); // Asegurarse de que el estado es true si se refresca correctamente
          return response;
        } else {
          this.logout();
          return null;
        }
      }),
      catchError((error) => {
        this.logout();
        return of(null);
      })
    );
  }

  // refrescarToken(): Observable<any> {
  //   const token = localStorage.getItem('token');
  //   if (!token) {
  //     //  console.log("No hay token en localStorage, cerrando sesión...");
  //     this.logout();
  //     return of(null);
  //   }

  //   //  console.log("Enviando solicitud para refrescar token a:", this.getUrl(this.endpoints.refresh));
  //   //  console.log("Token enviado:", localStorage.getItem('token'));

  //   return this.http.get(this.getUrl(this.endpoints.refresh), {
  //     headers: { Authorization: `Bearer ${token}` }
  //   }).pipe(
  //     map((response: any) => {
  //       //   console.log("Respuesta de refresco de token:", response);
  //       if (response.success && response.token) {
  //         localStorage.setItem('token', response.token);
  //         this.lastActivity = Date.now();
  //         return response;
  //       } else {
  //         //    console.log("No se recibió un nuevo token, cerrando sesión...");
  //         this.logout();
  //         return null;
  //       }
  //     }),
  //     catchError((error) => {
  //       //  console.error('Error al refrescar token:', error);
  //       this.logout();
  //       return of(null);
  //     })
  //   );
  // }

  startTokenValidation() {
    if (this.tokenValidationSubscription) {
      this.tokenValidationSubscription.unsubscribe();
    }

    this.tokenValidationSubscription = interval(this.tokenCheckInterval).subscribe(() => {
      // Usar hasValidToken() como la fuente de verdad
      // Si el token no es válido (ha expirado), intentamos refrescar
      if (!this.hasValidToken()) { // Si hasValidToken() es false (token expirado)
        console.log('Token inválido o expirado, intentando refrescar o cerrando sesión...');
        this.refrescarToken().subscribe(response => {
          if (!response) { // Si el refresco falla
            this.logout();
          }
        });
      } else {
        // console.log('Token es válido.');
      }

      // También manejar la inactividad independientemente de la expiración del token
      const inactiveTime = Date.now() - this.lastActivity;
      if (inactiveTime > this.inactivityTime) {
        console.log('Inactividad detectada, cerrando sesión.');
        this.logout();
      }
    });
  }


  // startTokenValidation() {
  //   if (this.tokenValidationSubscription) {
  //     this.tokenValidationSubscription.unsubscribe();
  //   }

  //   this.tokenValidationSubscription = interval(this.tokenCheckInterval).subscribe(() => {
  //     if (!localStorage.getItem('token')) {
  //       this.stopTokenValidation();
  //       return;
  //     }

  //     const inactiveTime = Date.now() - this.lastActivity;
  //     const tokenExpiration = this.getTokenExpiration();
  //     const timeLeft = tokenExpiration ? tokenExpiration - Date.now() : 0;


  //     // console.log(`Tiempo inactivo: ${inactiveTime / 1000} segundos, Tiempo restante del token: ${timeLeft/1000} segundos`);

  //     if (inactiveTime > this.inactivityTime || (timeLeft > 0 && timeLeft < 5 * 60 * 1000) || !this.esTokenValido()) { // 5 minutos de anticipación
  //       //   console.log('Refrescando token por inactividad o proximidad a expiración');
  //       this.refrescarToken().subscribe(response => {
  //         if (!response || !this.esTokenValido()) {
  //           //         console.log('No se pudo refrescar el token o sigue inválido, cerrando sesión');
  //           this.logout();
  //         }
  //       });
  //     } else {
  //       //  console.log('No es necesario refrescar el token aún.');
  //     }
  //   });
  // }

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
    this.clearAuthDataAndLogout(); // Usa el nuevo método para limpiar y emitir el estado de logout
    this.router.navigate(['/login']);
  }

  // logout() {
  //   this.stopTokenValidation();
  //   localStorage.clear();
  //   this.router.navigate(['/login']);
  // }

}

