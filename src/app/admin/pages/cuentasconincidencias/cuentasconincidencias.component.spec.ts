import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasconincidenciasComponent } from './cuentasconincidencias.component';

describe('CuentasconincidenciasComponent', () => {
  let component: CuentasconincidenciasComponent;
  let fixture: ComponentFixture<CuentasconincidenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CuentasconincidenciasComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CuentasconincidenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
