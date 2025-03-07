import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments.prod';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private baseUrl = environment.apiBaseUrl;

  private endpoinds = {
    productos: '/getProductsClient.php',
  }

  constructor(private http: HttpClient) { }

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  getProducts(usuario: string, listaprecio: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = JSON.stringify({ usuario, listaprecio });
  
    return this.http.post(this.getUrl(this.endpoinds.productos), body, { headers });
  }

  
  
}
