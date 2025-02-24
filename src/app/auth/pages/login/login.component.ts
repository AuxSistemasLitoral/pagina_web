import { Component } from '@angular/core';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario: string = '';
  clave: string = '';

  constructor(private authService: AuthService){}

  login(){
    this.authService.login(this.usuario, this.clave).subscribe( 
      (response)=>{
        if(response.sucess){
          localStorage.setItem('token', response.token);
          alert('Login exitoso');
        }else{
          alert('Credenciales inválidas');
        }
      },
      (error)=>{
        console.error('Error en login', error);
        alert('Error en el servidor');
      }
    )
  }

}
