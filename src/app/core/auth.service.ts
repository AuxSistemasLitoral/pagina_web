import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, fromEvent, interval, map, Observable, of, switchMap } from 'rxjs';
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
    refresh: '/proteger.php'
  };

 private inactivityTime = 10 * 60 * 1000;
 private lastActivity: number = Date.now();

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
    return exp ? Date.now() < exp : false;
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
      } else {
        console.log("No se recibió un nuevo token, cerrando sesión...");
        this.logout();
      }
      return response;
    }),
    catchError((error) => {
      console.error('Error al refrescar token:', error);
      this.logout();
      return of(null);
    })
  );
}


  startTokenValidation() {
    interval(60000).subscribe(() => {
      if (!localStorage.getItem('token')) return;

      if (this.esTokenValido()) {
        const tiempoRestante = this.getTokenExpiration()! - Date.now();
        console.log('Tiempo restante:', tiempoRestante / 1000, 'segundos');        
        // Si el token está por expirar en menos de 5 minutos, intentar refrescarlo
        if (tiempoRestante < 5 * 60 * 1000) {
          this.refrescarToken().subscribe();
        }
      } else {
        console.log('Token expirado, intentando refrescar...');
        this.refrescarToken().subscribe();
      }
    });
  }

  detectarActividad() {
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    eventos.forEach(evento => {
      fromEvent(document, evento).subscribe(() => {
        this.lastActivity = Date.now();
      });
    });

    interval(30000).subscribe(() => {
      const inactiveTime = Date.now() - this.lastActivity;
      console.log('Tiempo inactivo:', inactiveTime / 1000, 'segundos');
      
      if (inactiveTime > this.inactivityTime && localStorage.getItem('token')) {
        console.log('Intentando refrescar token por inactividad...');
        this.refrescarToken().subscribe(response => {
          if (!response || !this.esTokenValido()) { 
            console.log('No se pudo refrescar el token o sigue inválido, cerrando sesión');
            this.logout();
          }
        });
    }
    
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

}
