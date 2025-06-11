import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments.prod';

@Injectable({
  providedIn: 'root'
})
export class RutaVendedoresService {
  private baseUrl = environment.apiBaseUrl;
  
  private endpoinds = {
    listSale : '/listar_vendedor.php',
    routeTracking : '/seguimiento_ruta.php'
  };

  constructor(private http: HttpClient) { } 

listSales(usuario: string): Observable<any[]> {
  const body = new HttpParams().set('usu', usuario);
  return this.http.post<any[]>(`${this.baseUrl}${this.endpoinds.listSale}`, body);
}

getTracking(payload: { vendedor: string; fecha: string }) {
  const body = new HttpParams()
    .set('vendedor', payload.vendedor)
    .set('fecha', payload.fecha);
  return this.http.post<any>(`${this.baseUrl}${this.endpoinds.routeTracking}`, body);
}



}
