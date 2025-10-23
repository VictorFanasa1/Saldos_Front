import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasincidenciasComponent } from './cuentasincidencias.component';

describe('CuentasincidenciasComponent', () => {
  let component: CuentasincidenciasComponent;
  let fixture: ComponentFixture<CuentasincidenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CuentasincidenciasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CuentasincidenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
