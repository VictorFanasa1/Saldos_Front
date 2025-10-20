import { Component, OnInit, EventEmitter, HostBinding, Input, OnChanges, Output  } from '@angular/core';

@Component({
  selector: 'app-spin-overlay',
  templateUrl: './spin-overlay.component.html',
  styleUrls: ['./spin-overlay.component.css']
})
export class SpinOverlayComponent implements OnChanges {
  /** Muestra/oculta el overlay */
  @Input() visible = false;
  /** Ruta del logo (PNG/SVG) */
  @Input() src = 'assets/icons/icon-512x512.png';
  /** Tamaño del logo */
  @Input() size = 160; // px
  /** Emite cuando el usuario cierra */
  @Output() closed = new EventEmitter<void>();

  /** Evita scroll del body cuando está visible */
  @HostBinding('class.no-scroll') noScroll = false;
@Input() dismissible = true;
  ngOnChanges() {
    this.noScroll = this.visible;
    if (this.noScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  close() {
    this.visible = false;
    this.ngOnChanges();
    this.closed.emit();
  }

  stop(e: MouseEvent) {
    // Evita que el click dentro del cuadro cierre el overlay
    e.stopPropagation();
  }

  closeOnBackdrop() {
  if (this.dismissible) this.close();
}
}
