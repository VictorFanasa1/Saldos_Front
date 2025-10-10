import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormagenteComponent } from './formagente.component';

describe('FormagenteComponent', () => {
  let component: FormagenteComponent;
  let fixture: ComponentFixture<FormagenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormagenteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormagenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
