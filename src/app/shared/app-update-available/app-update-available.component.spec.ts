import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppUpdateAvailableComponent } from './app-update-available.component';

describe('AppUpdateAvailableComponent', () => {
  let component: AppUpdateAvailableComponent;
  let fixture: ComponentFixture<AppUpdateAvailableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppUpdateAvailableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppUpdateAvailableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
