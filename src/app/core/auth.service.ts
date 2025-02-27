import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, interval, map, Observable, switchMap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 private apiUrl = 'http://Muriel:8000/login.php';
 private apiSucursal = 'http://Muriel:8000/cliente_sucursal.php';
 private apiRefresh = 'http://Muriel:8000/proteger.php';
 private inactivityTime = 10 * 20 * 1000;
 private lastActivity: number = Date.now();

  constructor(private http: HttpClient, private router: Router) {
    this.detectarActividad();
    this.startTokenvalidation();
   }

  login(usuario: string, clave: string): Observable<any>{   
    return this.http.post(this.apiUrl, {usuario, clave});
  }

  getSucursales(nit: string): Observable<any>{ 
    console.log('url enviada', this.apiSucursal);
    return this.http.post(this.apiSucursal, { nit }); 
    
  }

  guardarSesion(token: string, usuario: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    localStorage.setItem('nit', JSON.stringify(usuario.cedula.toString()));
  }

  decodificarToken(): any | null {
    const token = localStorage.getItem('token');
    if(!token){
      return null;
    }
    try{
      return jwtDecode(token);
    
    }catch (error){
      console.log('Error al decodificar el token', error);
      return null;
    }
  }

  private getTokenExpiration(): number | null{
    const tokenDecodificado = this.decodificarToken();
    return tokenDecodificado ? tokenDecodificado.exp * 1000 : null;
  }

  private esTokenValido(): boolean{
    const exp = this.getTokenExpiration();
    return exp ? Date.now() < exp : false;
  }

  refrescarToken(): Observable<any> {
    return this.http.get(this.apiRefresh).pipe(
      map((response: any) => {
        if (response.success && response.token) {
          localStorage.setItem('token', response.token);
        } else {
          this.logout();
        }
        return response;
      })
    );
  }

  startTokenvalidation(){
    interval(60000).pipe( 
      switchMap(()=>{
        if(this.esTokenValido()){
          const tiempoRestante = this.getTokenExpiration()! - Date.now();
          if(tiempoRestante < 5 * 60 * 1000){
            return this.refrescarToken();
          }
        }else{
          this.logout();
        }
        return[];
      })
    ).subscribe();
  }

  detectarActividad(){
    const eventos = ['mousemove', 'keydown', 'click'];
    eventos.forEach(evento => {
      fromEvent(document, evento).subscribe(()=> this.lastActivity = Date.now());
    });
    interval(60000).subscribe(()=>{
      if(Date.now() - this.lastActivity > this.inactivityTime){
        this.logout();
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

}
