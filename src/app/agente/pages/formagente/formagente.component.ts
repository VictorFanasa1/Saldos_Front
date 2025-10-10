import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CuentasSaldosPreguntasDto } from 'src/app/core/shared/cuentasPreguentasRequest';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';


@Component({
  selector: 'app-formagente',
  templateUrl: './formagente.component.html',
  styleUrls: ['./formagente.component.css']
})
export class FormagenteComponent implements OnInit {

  id!: number;
  formularioagente: FormGroup;
  visibleBtnGuardar = true
  disbaledradios = true
   private readonly USER_KEY = 'app_user';
fmtMXN = (v: any) =>
  new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', minimumFractionDigits:2 }).format(Number(v ?? 0));
  constructor(private route: ActivatedRoute, private saldosservice: SaldosService,   private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.formularioagente = this.fb.group({
       // Datos básicos
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
    evidencia: ['']
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
    if (v === false) {
      rc.setValidators([Validators.required, Validators.minLength(5)]);
    } else {
      rc.clearValidators();
      rc.setValue('', { emitEvent: false });
    }
    rc.updateValueAndValidity({ emitEvent: false });
  });
}
  ngOnInit(): void {

    const v = this.route.snapshot.paramMap.get('id');
    this.id = v ? Number(v) : NaN;

    this.consultaRegistros()
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
        // dto es el objeto que pegaste en el mensaje
      this.formularioagente.patchValue({
        // Datos básicos
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
        this.visibleBtnGuardar = false

        console.log(res)

        this.patchRadioAndMaybeDisable('acuerdoSaldo',            res.p1);
        this.patchRadioAndMaybeDisable('comprobantePagos',        res.p2);
        this.patchRadioAndMaybeDisable('pagosPendientes',         res.p3);
        this.patchRadioAndMaybeDisable('devolucionesPendientes',  res.p4);
        this.patchRadioAndMaybeDisable('reclamacionesPendientes', res.p5);
      },
      error: er =>{
        this.visibleBtnGuardar = true
        console.log("No hay datos")
        console.error(er)
      }
    })
  }

  toTriBool(v: any): boolean | null {
    if (v === 1 || v === true) return true;
    if (v === 0 || v === false) return false;
    return null; // null, undefined, '' => sin selección
  }

   makeFolio(prefix = 'SP', digits = 5): string {
    const yyyymmdd = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const n = crypto.getRandomValues(new Uint32Array(1))[0] % Math.pow(10, digits);
    const code = n.toString().padStart(digits, '0');
    return `${prefix}-${yyyymmdd}-${code}`;
  }
volver(){
  this.router.navigate(['/agente'])
}
  grabarRespuestas(){

    if (this.formularioagente.invalid) {

      this.formularioagente.markAllAsTouched();
      return;
    }

    const f = this.formularioagente.value;
    let usuario
    let folio

    const anyNo =
    f.acuerdoSaldo === false ||
    f.comprobantePagos === false ||
    f.pagosPendientes === false ||
    f.devolucionesPendientes === false ||
    f.reclamacionesPendientes === false;

    this.auth.user$.pipe(take(1)).subscribe(u => {
      console.log('username:', u?.username);
      usuario = u?.username
    });
    const dto: CuentasSaldosPreguntasDto = {
      id: this.id,
      p1: f.acuerdoSaldo === true ? 1 : 0,
      p2: f.comprobantePagos === true ? 1 : 0,
      p3: f.pagosPendientes === true ? 1 : 0,
      p4: f.devolucionesPendientes === true ? 1 : 0,
      p5: f.reclamacionesPendientes === true ? 1 : 0,

      comentarios: f.comentarios ?? '',
      evidencia: f.evidencia ?? '',
      usuario_registra: usuario ?? '' ,

      p1_razon: f.p1_razon ?? '',
      p2_razon: f.p2_razon ?? '',
      p3_razon: f.p3_razon ?? '',
      p4_razon: f.p4_razon ?? '',
      p5_razon: f.p5_razon ?? '',
      folio_registro: f.confirmacionCliente ?? '',
      folio_soporte: anyNo ? (f.folio_soporte || this.makeFolio()) : ''
    };
console.log(dto)
    this.saldosservice.registrarPeguntas(dto).subscribe({
      next: res=>{
        alert("Registro guardado")

        this.router.navigate(['agente']);
      },
      error: e =>{
        console.log(e.error.error)

      }
    })

    }
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
}
