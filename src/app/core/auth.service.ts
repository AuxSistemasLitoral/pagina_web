import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 private apiUrl = 'http://Muriel:8000/login.php';


  constructor(private http: HttpClient) { }

  login(usuario: string, clave: string): Observable<any>{
   
    return this.http.post(this.apiUrl, {usuario, clave});
  }
}
