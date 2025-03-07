import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, interval, map, Observable, of, switchMap, Subscription, catchError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environments.prod';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiBaseUrl;

  private endpoints = {
    login: '/login.php',
    sucursal: '/cliente_sucursal.php',
    refresh: '/proteger.php',
    cupo: '/cupo_cliente.php'
  };

  private inactivityTime = 10 * 60 * 1000;
  private lastActivity: number = Date.now();
  private tokenCheckInterval: number = 60000; // Intervalo para verificar el token (1 minuto)
  private tokenValidationSubscription: Subscription | undefined;


  constructor(private http: HttpClient, private router: Router) {
    this.detectarActividad();
    this.startTokenValidation();
  }

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  login(usuario: string, clave: string): Observable<any>{
    return this.http.post(this.getUrl(this.endpoints.login), {usuario, clave})
  }

  getSucursales(nit: string): Observable<any>{
    return this.http.post(this.getUrl(this.endpoints.sucursal),{nit})

  }

  guardarSesion(token: string, usuario: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('nit', JSON.stringify(usuario.cedula.toString()));
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

  obtenerCupo(id: string): Observable<any> {
    console.log('entro a obtener cupu')
    return this.http.post(this.getUrl(this.endpoints.cupo), { id }, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}