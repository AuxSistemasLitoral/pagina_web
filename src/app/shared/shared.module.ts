import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { FormsModule } from '@angular/forms';
import { SharedService } from './shared.service';
import { DialogComponent } from './dialog/dialog.component';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    DialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule
  ],
  exports: [
    HeaderComponent,
    FooterComponent,    
    DialogComponent 
  ],
  //entryComponents: [DialogComponent],
  providers: [SharedService]
})
export class SharedModule { }
