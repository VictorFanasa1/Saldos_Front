import { Component, ElementRef, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CuentasSaldosPreguntasDto } from 'src/app/core/shared/cuentasPreguentasRequest';
import { concatMap, debounceTime, distinctUntilChanged, map, take, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import Swal from 'sweetalert2';
import { GeolocationService, GeoPoint } from 'src/app/core/shared/geolocation.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SendMailBodyRequest } from 'src/app/core/shared/sendMailClient.Model';
import { empty, from, Observable, Subject } from 'rxjs';
import { UiService } from 'src/app/shared/service/ui.service';


type Pt = { x: number; y: number; t: number };

@Component({
  selector: 'app-formagente',
  templateUrl: './formagente.component.html',
  styleUrls: ['./formagente.component.css']
})
export class FormagenteComponent implements OnInit {
step = 1;
  totalSteps = 3;
  submitting = false;
  id!: number;
  formularioagente: FormGroup;
  visibleBtnGuardar = true
  disbaledradios = true
  estadoPermiso: string | null = null;
  ubicacion: GeoPoint | null = null;
  error: string | null = null;
  tipo_incidencia = 0
   private readonly USER_KEY = 'app_user';
    @ViewChild('sigCanvas', { static: false }) set sigCanvasSetter(ref: ElementRef<HTMLCanvasElement> | undefined) {
      if (ref) {
        this.canvasRef = ref;
        // Cuando el canvas aparece via *ngIf, inicializa contexto y tamaño
        this.initCanvas();
      }
    }
    private canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private pts: Pt[] = [];
   private paths: Pt[][] = [];   // <<< todos los grafos
  private currentPath: Pt[] = [];
  private bg = '#fff';         // fondo blanco (mejor para imprimir/PDF)
  lineWidth = 2.2;
  stroke = '#111';
  lat = 0;
  longio = 0;
  firmaObjectUrl?: string;
  cargandos = true;
  firmaSafeUrl?: SafeUrl;
  sucursal = ""
  correo: string = ""
  folio = ""
  numerodefolio = ""
  cargando = false
  folios: Array<number> = []
fmtMXN = (v: any) =>
  new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', minimumFractionDigits:2 }).format(Number(v ?? 0));
  private destroy$ = new Subject<void>();
  constructor(private route: ActivatedRoute,
    private saldosservice: SaldosService,
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private ui: UiService,
    private geo: GeolocationService) {
    this.formularioagente = this.fb.group({
       // Datos básicos
    correocliente: ['', Validators.required],
    confirmacionCliente: ['', Validators.required],
    nombreCorto: ['', Validators.required],
    cuentaOracle: ['', Validators.required],
    razonSocial: [''],

    // Cartera (números)
    carteraTotal: [0, [Validators.required, Validators.min(0)]],
    carteraPorVencer: [0, [Validators.min(0)]],
    carteraVencida: [0, [Validators.min(0)]],
    vencida7: [0, [Validators.min(0)]],
    vencida8a14: [0, [Validators.min(0)]],
    vencida15a21: [0, [Validators.min(0)]],
    vencida22Plus: [0, [Validators.min(0)]],

    // Preguntas Sí/No (booleans)
   acuerdoSaldo: [null, Validators.required],
    p1_razon: [''],
    comprobantePagos: [null, Validators.required],
    p2_razon: [''],
    pagosPendientes: [null, Validators.required],
    p3_razon: [''],
    devolucionesPendientes: [null, Validators.required],
    p4_razon: [''],
    reclamacionesPendientes: [null, Validators.required],
    p5_razon: [''],

    // Extras del body
    comentarios: [''],
    evidencia: [''],
    firma: [null, Validators.required]
    })

    this.attachReasonToggler('acuerdoSaldo', 'p1_razon');
  this.attachReasonToggler('comprobantePagos', 'p2_razon');
  this.attachReasonToggler('pagosPendientes', 'p3_razon');
  this.attachReasonToggler('devolucionesPendientes', 'p4_razon');
  this.attachReasonToggler('reclamacionesPendientes', 'p5_razon');
   }
private attachReasonToggler(booleanCtrl: string, reasonCtrl: string) {
  const bc = this.formularioagente.get(booleanCtrl)!;
  const rc = this.formularioagente.get(reasonCtrl)!;
  bc.valueChanges.subscribe((v: boolean | null) => {

    if(reasonCtrl == 'p3_razon' || reasonCtrl == 'p4_razon' || reasonCtrl == 'p5_razon'){

      if (v === true) {
        rc.clearValidators();
        rc.setValue('', { emitEvent: false });

      } else {
       //rc.setValidators([Validators.required, Validators.minLength(5)]);
      }
      rc.updateValueAndValidity({ emitEvent: false });
    }else{
      if (v === false) {
      //rc.setValidators([Validators.required, Validators.minLength(5)]);
    } else {
      rc.clearValidators();
      rc.setValue('', { emitEvent: false });
    }
    rc.updateValueAndValidity({ emitEvent: false });
    }

  });
}
  ngOnInit(): void {
    this.solicitarUnaVez()
    const v = this.route.snapshot.paramMap.get('id');
    this.id = v ? Number(v) : NaN;
this.ui.showAdmin(false)
    this.ui.showAdminDownSet(false)
    this.ui.showrRepresentante(true)
    this.consultaRegistros()
    this.saldosservice.getFirmaBlob(this.id).subscribe({
      next: resp => {
        const blob = resp!;
        console.log(blob)
        if (!blob || blob.size === 0) {
      this.visibleBtnGuardar = true;
      this.cargandos = true;
      return;
    }
        this.firmaObjectUrl = URL.createObjectURL(blob);
        this.firmaSafeUrl = this.sanitizer.bypassSecurityTrustUrl(this.firmaObjectUrl);// crea URL temporal
        this.cargandos = false;
        this.visibleBtnGuardar = false;
      },
      error: _ => {
        this.visibleBtnGuardar = true;
        this.cargandos = true
        this.firmaSafeUrl = undefined;
        if (this.firmaObjectUrl) {
          URL.revokeObjectURL(this.firmaObjectUrl);
          this.firmaObjectUrl = undefined;
        }
      }
    })
    this.formularioagente.get('correocliente')!.valueChanges
    .pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map((v:string | null | undefined) => (v ?? '' ).trim().toLocaleLowerCase()),
      takeUntil(this.destroy$)
    ).subscribe(v=> this.correo = v)

  }
  ngAfterViewInit() {
    // Inicializa canvas DPI y fondo
    if (this.cargandos) this.initCanvas();
  }
  initCanvas(){
    if (this.ctx) return; // evitar doble inicialización si ya existe
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.fitCanvas();
    this.paintBg();

      new ResizeObserver(() => { this.fitCanvas(); this.redrawAll(); })
      .observe(this.canvasRef.nativeElement.parentElement!);
  }
  ngOnChanges(changes: SimpleChanges) {
  if (changes['cargandos']?.currentValue === true) {
    // El template se vuelve a crear; espera a que Angular pinte y re-inicializa
    queueMicrotask(() => this.initCanvas()); // o setTimeout(...,0)
  }
}
formatMoneyRegex(txt: number | string | null | undefined): string {
  if (txt == null) return '';


  let s = String(txt).replace(/[^\d.,-]/g, '');


  const negative = s.trim().startsWith('-');
  s = s.replace(/-/g, '');


  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    const last = Math.max(lastComma, lastDot);
    s = s
      .replace(/[.,]/g, (m, i) => (i === last ? '.' : ''))
  } else {

    if (lastComma !== -1 && lastDot === -1) s = s.replace(/,/g, '.');

  }


  const parts = s.split('.');
  let entero = parts[0].replace(/^0+(?=\d)/, '');
  let dec = parts[1] ?? '';


  entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');


  if (dec.length > 2) dec = dec.slice(0, 2);
  if (dec.length < 2) dec = dec.padEnd(2, '0');

  const res = (negative ? '-' : '') + (entero || '0') + '.' + dec;
  return res;
}
 parseMoneyToNumber(money: string): number {
  if (!money) return 0;
  const negative = /^\s*-/.test(money);
  const clean = money.replace(/,/g, '').replace(/[^\d.]/g, '');
  const n = parseFloat(clean || '0');
  return negative ? -n : n;
}
  consultaRegistros(){
    this.saldosservice.consultaregistroid(this.id).subscribe({
       next: (dto) => {
        console.log(dto)
      console.log(dto.sNombreCorto)
      this.sucursal = dto.sSucursal ?? ''
        // dto es el objeto que pegaste en el mensaje
      this.formularioagente.patchValue({
        // Datos básicos
        correocliente: dto.sCorreo ?? '',
        confirmacionCliente: '', // o dto.uiRow?.toString() si lo quieres usar como folio
        nombreCorto: dto.sNombreCorto ?? '',
        cuentaOracle: dto.sCuentaOracle ?? '',
        razonSocial: dto.sCliente ?? '',

        // Cartera
        carteraTotal:       '$ '+this.formatMoneyRegex(dto.dTotalCartera),
        carteraPorVencer:   '$ '+this.formatMoneyRegex(dto.dPorVencer),
        carteraVencida:     '$ '+this.formatMoneyRegex(dto.dVencido),
        vencida7:           '$ '+this.formatMoneyRegex(dto.dVencido7Dias),
        vencida8a14:        '$ '+this.formatMoneyRegex(dto.dVencido8a14Dias),
        vencida15a21:       '$ '+this.formatMoneyRegex(dto.dVencido15a21Dias),
        vencida22Plus:      '$ '+this.formatMoneyRegex(dto.dVencido22a28Dias)
      });
    },
    error: (err) => console.error(err)
    })
    this.saldosservice.consultaregistroPreguntas(this.id).subscribe({
      next: res =>{

        if(res.length == 0 || typeof res !== 'undefined'){ this.visibleBtnGuardar = true} else {this.visibleBtnGuardar = false}


        console.log(res)

        this.formularioagente.patchValue({
          p1_razon: res[0].p1_razon,
          p2_razon: res[0].p2_razon,
          p3_razon: res[0].p3_razon,
          p4_razon: res[0].p4_razon,
          p5_razon: res[0].p5_razon
        })
        this.patchvalueanddisablearea('p1_razon', false)
        this.patchvalueanddisablearea('p2_razon', false)
        this.patchvalueanddisablearea('p3_razon', false)
        this.patchvalueanddisablearea('p4_razon', false)
        this.patchvalueanddisablearea('p5_razon', false)
        this.patchRadioAndMaybeDisable('acuerdoSaldo',            res[0].p1);
        this.patchRadioAndMaybeDisable('comprobantePagos',        res[0].p2);
        this.patchRadioAndMaybeDisable('pagosPendientes',         res[0].p3);
        this.patchRadioAndMaybeDisable('devolucionesPendientes',  res[0].p4);
        this.patchRadioAndMaybeDisable('reclamacionesPendientes', res[0].p5);
      },
      error: er =>{

        console.log("No hay datos")
        console.error(er)
      }
    })
  }
ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  toTriBool(v: any): boolean | null {
    if (v === 1 || v === true) return true;
    if (v === 0 || v === false) return false;
    return null; // null, undefined, '' => sin selección
  }

   makeFolio(prefix = 'CS', consecutivo: number, sucursal: string): string {
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = String(consecutivo).padStart(5, '0'); // 00001, 00042, 59542...
    return `${prefix}-${sucursal}-${yyyymmdd}-${code}`;
  }
  async getNextFolio(): Promise<string>{
    const res = await this.saldosservice.getlastfolionumber(this.id).toPromise(); // res: string
    const numStr = res.match(/(\d+)\s*$/)?.[1] ?? '0';
    const siguiente = (Number(numStr) || 0) + 1;
    return this.makeFolio('CS', siguiente, this.sucursal);
  }

  async registerWithFolio(folio: string): Promise<void> {
  if (this.formularioagente.invalid) {
    this.formularioagente.markAllAsTouched();
    await Swal.fire({ icon: 'error', title: 'Oops...', text: 'El formulario tiene campos vacíos.' });
    throw new Error('Formulario inválido');

  }

  const f = this.formularioagente.value;

  //const u = await firstValueFrom(this.auth.user$.pipe(take(1)));
  let usuario;
  this.auth.user$.pipe(take(1)).subscribe(u => { console.log('username:', u?.username); usuario = u?.username ?? '' });
  let evidencia: any = null;
  const dataURL = f.firma as string | undefined;
  if (dataURL) {
    const base64 = dataURL.split(',')[1]?.replace(/\s/g, '') ?? '';
    evidencia = { fileName: 'signature_' + usuario, contentType: 'image/png', dataBase64: base64 };
  }

  const dto: CuentasSaldosPreguntasDto = {
    id: this.id,
    p1: f.acuerdoSaldo ? 1 : 0,
    p2: f.comprobantePagos ? 1 : 0,
    p3: f.pagosPendientes === true? 1 : 0,
    p4: f.devolucionesPendientes === true ? 1 : 0,
    p5: f.reclamacionesPendientes === true ? 1 : 0,

    comentarios: f.comentarios ?? '',
    evidencia: f.evidencia ?? '',
    usuario_registra: usuario ?? '',

    p1_razon: f.p1_razon ?? '',
    p2_razon: f.p2_razon ?? '',
    p3_razon: f.p3_razon ?? '',
    p4_razon: f.p4_razon ?? '',
    p5_razon: f.p5_razon ?? '',

    folio_registro: f.confirmacionCliente ?? '',
    folio_soporte: folio,
    lat: this.lat?.toString() ?? '',
    longi: this.longio?.toString() ?? '',
    firma: evidencia,
    tipo_incidencia: this.tipo_incidencia.toString()
  };

  await this.saldosservice.registrarPeguntas(dto).toPromise();// espera al POST
}
volver(){
  this.router.navigate(['/agente'])
}

  async grabarRespuestas(){
     const f = this.formularioagente.value;
console.log(f.acuerdoSaldo)
console.log(f.comprobantePagos)
console.log(f.pagosPendientes)
console.log(f.devolucionesPendientes)
console.log(f.reclamacionesPendientes)
  try {

    if (!(f.acuerdoSaldo === true && f.comprobantePagos === true && f.pagosPendientes === false)) {
      this.tipo_incidencia = 1
      const folio1 = await this.getNextFolio();
      await this.registerWithFolio(folio1);
      await Swal.fire({ icon: 'success', title: 'Guardado', text: `Se guardo la información` });

    }


    if (!(f.devolucionesPendientes === false && f.reclamacionesPendientes === false)) {
      this.tipo_incidencia = 2
      const folio2 = await this.getNextFolio();
      await this.registerWithFolio(folio2);
      await Swal.fire({ icon: 'success', title: 'Guardado', text: `Se guardo la información` });
    }


    if ((f.acuerdoSaldo  === true && f.comprobantePagos === true) && (f.pagosPendientes  === false && f.devolucionesPendientes  === false && f.reclamacionesPendientes === false)) {
      this.tipo_incidencia = 0
      await this.registerWithFolio("");
      await Swal.fire({ icon: 'success', title: 'Guardado', text: `Su informacion fue cargada en el sistema` });
    }

    this.router.navigate(['/agente']);
  } catch (e: any) {
    console.error(e);
    await Swal.fire({ icon: 'error', title: 'Error', text: e?.message ?? 'No se pudo guardar' });
  }



    }

    /* Logica del folio */



patchRadioAndMaybeDisable(ctrlName: string, rawValue: any) {
  const tri = this.toTriBool(rawValue);
  const ctrl = this.formularioagente.get(ctrlName)!;
  ctrl.patchValue(tri, { emitEvent: false });
  if (tri !== null) {
    ctrl.disable({ emitEvent: false });   // ya había dato → bloquear
  } else {
    ctrl.enable({ emitEvent: false });    // sin dato → editable
  }
}

patchvalueanddisablearea(ctrlName: string, rawValue: any){
  const tri = this.toTriBool(rawValue);
  const ctrl = this.formularioagente.get(ctrlName)!;
  //ctrl.patchValue(tri, { emitEvent: false });
  if (tri !== null) {
    ctrl.disable({ emitEvent: false });   // ya había dato → bloquear
  } else {
    ctrl.enable({ emitEvent: false });    // sin dato → editable
  }
}

async solicitarUnaVez() {

    this.error = null;
    this.cargando = true;
    this.estadoPermiso = await this.geo.permissionState();

    try {
      const pos = await this.geo.getCurrentPosition();
      this.ubicacion = pos;
      console.log(pos.lat)
      this.lat = pos.lat,
      this.longio = pos.lng
    } catch (e: any) {
      this.error = e?.message ?? String(e);
    } finally {
      this.cargando = false;
    }
  }

  onDown(e: PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    this.formularioagente.get('firma')!.markAsTouched();
    this.drawing = true;
    this.currentPath = [];
    this.paths.push(this.currentPath);        // <<< inicia un nuevo grafo
    this.addPoint(e);
  }

  onMove(e: PointerEvent) {
    if (!this.drawing) return;
    this.addPoint(e);
    this.redrawAll();                         // <<< repinta todo (no borra lo anterior)
  }

  onUp(_e: PointerEvent) {
    if (!this.drawing) return;
    this.drawing = false;
    // Guarda valor solo si hay tinta real
    const data = this.toDataURL();
    this.formularioagente.patchValue({ firma: data });
  }

  // === Dibujo ===
  private addPoint(e: PointerEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.currentPath.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: Date.now() });
  }

  private redrawAll() {
    const c = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
    this.paintBg();

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.stroke;

    for (const path of this.paths) {
      for (let i = 1; i < path.length; i++) {
        const p1 = path[i - 1], p2 = path[i];
        const dt = (p2.t - p1.t) || 1;
        const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const speed = d / dt;
        const w = Math.max(this.lineWidth * (1 - Math.min(speed * 0.7, 0.7)), 0.8);
        this.ctx.lineWidth = w;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }
    }
  }

  clearSig() {
    this.paths = [];
    this.currentPath = [];
    const c = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, c.width, c.height);
    this.paintBg();
    this.formularioagente.patchValue({ firma: null });
  }

  // (Opcional) Deshacer último grafo
  undoLast() {
    if (this.paths.length === 0) return;
    this.paths.pop();
    this.redrawAll();
    const data = this.toDataURL();
    this.formularioagente.patchValue({ firma: data });
  }

  private toDataURL(): string | null {
    const c = this.canvasRef.nativeElement;
    const data = this.ctx.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return c.toDataURL('image/png');
    return null;

  }

  private paintBg() {
    if (!this.bg || this.bg === 'transparent') return;
    const c = this.canvasRef.nativeElement;
    this.ctx.save();
    this.ctx.fillStyle = this.bg;
    this.ctx.fillRect(0, 0, c.width, c.height);
    this.ctx.restore();
  }

  private fitCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.style.width = '100%';
    canvas.style.height = '180px';

    const rect = canvas.getBoundingClientRect();
    const ratio = Math.ceil(window.devicePixelRatio || 1);

    // guarda imagen actual para reponer tras redimensionar
    const prev = this.ctx?.getImageData(0, 0, canvas.width, canvas.height);

    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(ratio, ratio);

    if (prev) { this.paintBg(); this.redrawAll(); } // redibuja desde paths
  }

  private dataURLtoBlob(dataURL: string): Blob {
    const [meta, b64] = dataURL.split(',');
    const mime = meta.match(/data:(.*?);base64/)![1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  async fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]); // solo base64
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
get pct() {
    return Math.round((this.step / this.totalSteps) * 100);
  }

  next() {
    if (this.stepValid(this.step)) {
      this.step = Math.min(this.step + 1, this.totalSteps);
    } else {
      this.touchStep(this.step);
    }
  }

  back() {
    this.step = Math.max(this.step - 1, 1);
  }

  stepValid(step: number): boolean {
    const controls = this.controlsOfStep(step);
    controls.forEach(c => this.formularioagente.get(c)?.updateValueAndValidity());
    return controls.every(c => this.formularioagente.get(c)?.valid);
  }

  touchStep(step: number) {
    this.controlsOfStep(step).forEach(c => this.formularioagente.get(c)?.markAsTouched());
  }

  controlsOfStep(step: number): string[] {
    if (step === 1) return ['firstName','lastName','email','phone','age','gender'];
    if (step === 2) return ['street','city','zip','country'];
    return ['username','password','confirm','terms'];
  }
  getCorreo(){

  }
  enviarotp(){
    const f = this.formularioagente.value;
    if(this.correo == null ||this.correo.trim() === '' || this.correo == undefined){
      Swal.fire({
          title:'¡Hey!',
          icon: 'info',
          text: "Debes ingresar un correo antes de solicitar un código OTP"
        })
    }
    const payload: SendMailBodyRequest = {id: this.id, farmacia:f.nombreCorto, correo: f.correocliente}
    this.saldosservice.sendMailtoClient(payload).subscribe({
      next: resp =>{
        Swal.fire({
          title:'Listo',
          icon: 'success',
          text: "Correo enviado"
        })
      },
      error: err =>{
        console.log(err)
        Swal.fire({
          title:'Error',
          icon: 'error',
          text: "Correo no enviado, revisa por favor la direccion de correo y que estes conectado a internet."
        })
      }
    })
  }

}

