import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinOverlayComponent } from './spin-overlay.component';

describe('SpinOverlayComponent', () => {
  let component: SpinOverlayComponent;
  let fixture: ComponentFixture<SpinOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpinOverlayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
