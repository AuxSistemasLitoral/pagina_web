import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private usuario: string = '';
  private listaprecio: string = '';
  private dataReady = new BehaviorSubject<boolean>(false);

  setUsuario(usuario: string) {
    this.usuario = usuario;
    this.checkDataReady();
  }

  setListaPrecio(listaprecio: string) {
    this.listaprecio = listaprecio;
    this.checkDataReady();
  }

  getUsuario() {
    return this.usuario;
  }

  getListaPrecio() {
    return this.listaprecio;
  }

  notifyDataReady() {
    this.dataReady.next(true);
  }

  getDataReadyObservable() {
    return this.dataReady.asObservable();
  }

  private checkDataReady() {
    if (this.usuario && this.listaprecio) {
      this.dataReady.next(true);
    }
  }
  
  private sucursalChangeSubject = new BehaviorSubject<any>(null);
  sucursalChanged$ = this.sucursalChangeSubject.asObservable();

  emitSucursalChange(sucursal: any) {
    this.sucursalChangeSubject.next(sucursal);
  }


}
