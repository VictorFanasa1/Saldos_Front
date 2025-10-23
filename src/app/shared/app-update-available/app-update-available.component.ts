import { Component, OnDestroy, OnInit } from '@angular/core';
import { UpdateService } from 'src/app/core/services/update.service';

@Component({
  selector: 'app-app-update-available',
  templateUrl: './app-update-available.component.html',
  styleUrls: ['./app-update-available.component.css']
})
export class AppUpdateAvailableComponent implements OnInit {



  visible = false;
  private handler = () => this.visible = true;

  constructor(private us: UpdateService) {}

  ngOnInit(){
    window.addEventListener('app-update-available', this.handler);
  }
  ngOnDestroy(){
    window.removeEventListener('app-update-available', this.handler);
  }
  refresh(){ this.us.init; }

}
