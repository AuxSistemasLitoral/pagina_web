// src/app/services/cartera.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments.prod';

@Injectable({
  providedIn: 'root'
})
export class CarteraService {
  private baseUrl = environment.apiBaseUrl;

  private endpoints = {
    carteraPendiente: '/cartera.php',
    registrarPagoCartera: '/TransacPagoCartera.php',
    generarLinkPasarela: '/TransacPasarela.php',
    actualizarPago:'/TransacPagoCartera.php',
  };

  constructor(private http: HttpClient) { }

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  getCarteraPendiente(id: number): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = JSON.stringify({ id });

    return this.http.post(this.getUrl(this.endpoints.carteraPendiente), body, { headers });
  }

  registrarPagoCartera(payload: any): Observable<any> {
    return this.http.post(this.getUrl(this.endpoints.registrarPagoCartera), payload);
    responseType: 'json'
  }

  generarLinkPasarela(pagoid: number, total: number): Observable<any> {
    const formData = new FormData();
    formData.append('operacion', 'GenerarPago');
    formData.append('pagoid', pagoid.toString());
    formData.append('total', total.toString());

    return this.http.post(this.getUrl(this.endpoints.generarLinkPasarela), formData, {
      responseType: 'text'
    });

  }

updateCarteraPago(pagoid: number, orderid: string): Observable<any> {
  const data = {
    actualizar: {
      pagoid: pagoid,
      orderid: orderid,
      estado: '0'
    }
  };

  console.log('datos a actualizar', JSON.stringify(data));
  return this.http.post(this.getUrl(this.endpoints.actualizarPago), data);
}



}
