import {
  AfterViewInit, Component, ElementRef, EventEmitter, forwardRef, HostListener,
  Input, OnDestroy, Output, ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type Point = { x: number; y: number; t: number };
@Component({
  selector: 'app-signature-pad',
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.css'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SignaturePadComponent),
    multi: true
  }]
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() lineWidth = 2.2;
  @Input() strokeStyle = '#111';
  @Input() background = 'transparent'; // e.g. '#fff' si quieres fondo
  @Input() height = 180;        // CSS height
  @Input() minPointsToSave = 2; // evita guardar “tintas vacías”
  @Output() cleared = new EventEmitter<void>();
  @Output() signed = new EventEmitter<string>(); // dataURL

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private points: Point[] = [];
  private _value: string | null = null; // dataURL (PNG)
  private resizeObserver?: ResizeObserver;

  // ControlValueAccessor
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.fitCanvasToContainer();
    this.paintBackground();
    // Redimensiona cuando cambia el contenedor
    this.resizeObserver = new ResizeObserver(() => this.fitCanvasToContainer(true));
    this.resizeObserver.observe(this.canvasRef.nativeElement.parentElement!);
  }

  ngOnDestroy() { this.resizeObserver?.disconnect(); }

  // === Punteros (mouse/touch) ===
  @HostListener('pointerdown', ['$event']) onDown(e: PointerEvent) {
    if (e.pointerType === 'touch') (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    this.startStroke(e);
  }
  @HostListener('pointermove', ['$event']) onMove(e: PointerEvent) { this.updateStroke(e); }
  @HostListener('pointerup',   ['$event']) onUp(e: PointerEvent)   { this.endStroke(e); }
  @HostListener('pointerleave', ['$event']) onLeave(e: PointerEvent) { this.endStroke(e); }

  private startStroke(e: PointerEvent) {
    this.onTouched();
    this.drawing = true;
    this.points = [];
    this.addPoint(e);
  }
  private updateStroke(e: PointerEvent) {
    if (!this.drawing) return;
    this.addPoint(e);
    this.redraw();
  }
  private endStroke(_e: PointerEvent) {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.points.length >= this.minPointsToSave) {
      const data = this.toDataURL();
      this.emitValue(data);
      this.signed.emit(data!);
    }
  }

  private addPoint(e: PointerEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);
    this.points.push({ x, y, t: Date.now() });
  }

  private redraw() {
    this.clear(false);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.strokeStyle;
    // velocidad → grosor (opcional muy simple)
    for (let i = 1; i < this.points.length; i++) {
      const p1 = this.points[i - 1], p2 = this.points[i];
      const dt = (p2.t - p1.t) || 1;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const speed = dist / dt;
      const width = Math.max(this.lineWidth * (1 - Math.min(speed * 0.7, 0.7)), 0.8);
      this.ctx.lineWidth = width;
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }
  }

  clear(emit = true) {
    const c = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
    this.paintBackground();
    this._value = null;
    if (emit) {
      this.onChange(null);
      this.cleared.emit();
    }
  }

  /** Exporta PNG DataURL o null si vacío */
  toDataURL(): string | null {
    // detecta si hay píxeles no transparentes
    const c = this.canvasRef.nativeElement;
    const data = this.ctx.getImageData(0, 0, c.width, c.height).data;
    let hasInk = false;
    for (let i = 3; i < data.length; i += 4) { if (data[i] !== 0) { hasInk = true; break; } }
    if (!hasInk) return null;
    return c.toDataURL('image/png');
  }

  // === ControlValueAccessor ===
  writeValue(val: string | null): void {
    this._value = val;
    this.clear(false);
    if (val) this.drawImage(val);
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState?(isDisabled: boolean): void {
    this.canvasRef.nativeElement.style.pointerEvents = isDisabled ? 'none' : 'auto';
    this.canvasRef.nativeElement.style.opacity = isDisabled ? '0.6' : '1';
  }

  private emitValue(v: string | null) { this._value = v; this.onChange(v); }

  private drawImage(dataUrl: string) {
    const img = new Image();
    img.onload = () => this.ctx.drawImage(img, 0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    img.src = dataUrl;
  }

  private paintBackground() {
    if (this.background && this.background !== 'transparent') {
      this.ctx.save();
      this.ctx.fillStyle = this.background;
      const c = this.canvasRef.nativeElement;
      this.ctx.fillRect(0, 0, c.width, c.height);
      this.ctx.restore();
    }
  }

  private fitCanvasToContainer(keepContent = false) {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    // tamaño CSS → altura fija, ancho 100%
    canvas.style.width = '100%';
    canvas.style.height = `${this.height}px`;
    // DPI correcto
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.ceil(window.devicePixelRatio || 1);
    const prev = keepContent ? this.ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    this.ctx.scale(ratio, ratio);
    if (keepContent && prev) this.ctx.putImageData(prev, 0, 0);
    this.paintBackground();
  }
}
