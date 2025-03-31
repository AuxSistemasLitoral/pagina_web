import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SharedService } from 'src/app/shared/shared.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  dias: number = 0;

  constructor(
    private sharedService: SharedService,
    private router: Router
  ) {}

  ngOnInit() {
    // this.sharedService.dias$.subscribe((valor) => {
    //   this.dias = valor;
    //   console.log('dias en el home', this.dias);
    // });
  }  

  irAPedidos() {
    // if (this.dias === 1) {
    //   console.log('Navegando a pedidos, días:', this.dias);      
    //   setTimeout(() => {
    //     this.router.navigate(['/pedidos']);
    //   }, 100);
    // }
    this.router.navigate(['/pedidos']);
  }
}
