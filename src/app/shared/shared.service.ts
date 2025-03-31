import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  private diasSubject = new BehaviorSubject<number>(0);
  dias$ = this.diasSubject.asObservable();

  // setDias(valor: number) {
  //   localStorage.setItem('dias', valor.toString());
  //   this.diasSubject.next(valor);
  // }

  // getDias(): number {
  //   const diasStorage = localStorage.getItem('dias');
  //   if (diasStorage !== null) {
  //     const diasValue = parseInt(diasStorage, 10);
  //     this.diasSubject.next(diasValue);
  //     return diasValue;
  //   }
  //   return this.diasSubject.getValue();
  // }

  // async obtenerDias(): Promise<number> {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       const diasStorage = localStorage.getItem('dias');
  //       if (diasStorage !== null) {
  //         resolve(parseInt(diasStorage, 10));
  //       } else {
  //         reject('No se encontró el valor de días.');
  //       }
  //     }, 500);
  //   });
  // }
}
