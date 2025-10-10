import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormresponsableComponent } from './formresponsable.component';

describe('FormresponsableComponent', () => {
  let component: FormresponsableComponent;
  let fixture: ComponentFixture<FormresponsableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormresponsableComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormresponsableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
