import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environments.prod';
import { InformeVentasResponse } from '../models/informe-ventas';

@Injectable({
  providedIn: 'root'
})
export class InformesVentasService {
  private baseUrl = environment.apiBaseventas;

  private endpoints  = {
    salesBudget : '/ventasVSpresupuesto.php',
    salesDetail : '/venta_det.php'
  }

  constructor( private http: HttpClient) { }


getBugetSales(periodo: string, zona: string): Observable<InformeVentasResponse> {
    const body = new HttpParams()
      .set('periodo', periodo)
      .set('zona', zona); 

    const fullUrl = `${this.baseUrl}${this.endpoints.salesBudget}`;
    console.log('URL de la solicitud:', fullUrl);
    console.log('Cuerpo de la solicitud (POST):', body.toString());

    return this.http.post<InformeVentasResponse>(
      fullUrl,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
  }

 

  //getSalesDetail()

}
