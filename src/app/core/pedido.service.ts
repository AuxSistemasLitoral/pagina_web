import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments.prod';
import { Pedido } from '../models/pedido';
import { Proveedor } from '../models/proveedor';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private baseUrl = environment.apiBaseUrl;

  private endpoinds = {
    productos: '/getProductsClient.php',
    pedidos: '/pedidoWeb.php',
    proveedores:'/listarProveedores.php',
    productosProveedor: '/productosProveedor.php'  
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

  enviarPedido(pedido:Pedido){
   // return this.
  }

  getProveedores(): Observable<Proveedor[]> {
    const url = this.getUrl(this.endpoinds.proveedores);
    console.log('URL de proveedores:', url);
    return this.http.post<Proveedor[]>(url, {}); 
  }
  
  
  getProductosProveedor(proveedor: string): Observable<Producto[]> {
    const url = this.getUrl(this.endpoinds.productosProveedor);
    const body = { proveedor }; 
    return this.http.post<Producto[]>(url, body); 
  }
  
  
}
