import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  dias: number = 0;

  constructor(
    public authService: AuthService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.dias$.subscribe(dias => {
     // console.log('Días actualizado en Home:', dias);
      this.dias = dias;
    });
  }  

  irAPedidos() {
    this.router.navigate(['/pedidos']);
  }
}


