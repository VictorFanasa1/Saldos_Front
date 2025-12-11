import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
} from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';

import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { UiService } from 'src/app/shared/service/ui.service';
import Swal from 'sweetalert2';
declare const L: any;


@Component({
  selector: 'app-formresponsable',
  templateUrl: './formresponsable.component.html',
  styleUrls: ['./formresponsable.component.css'],
})
export class FormresponsableComponent implements OnInit {
  id!: number;
  flag!: number;
  formularioaadminsinincidencia: FormGroup;
  formularioagenteEvidencias: FormGroup;
  visibleBtnGuardar = true;
  disbaledradios = true;
  mostrartextareas = false;
  loading = false;
  archivoSeleccionado?: File;
  mostrarEvidencia = false;
  loadings = true;
  comentarios = '';
  kind: 'image' | 'pdf' | 'other' | null = null;
  private objectUrl?: string;
  imgUrl?: SafeUrl; // para <img [src]>
  pdfUrl?: SafeResourceUrl; // para <iframe [src]> o <object data>
  downloadName = 'evidencia';
  evidenciaexiste = false;
  latitud = '';
  longitud = '';
  iddelestatus = 0
  firmaObjectUrl?: string;
  cargandos = true;
  firmaSafeUrl?: SafeUrl;
  primerbloque = true;
  segundobloque = true;
  @ViewChild('osmMap', { static: false }) mapEl!: ElementRef<HTMLDivElement>;
  private map: any;
  private marker: any;
  calle = 'Insurgentes Sur';
  numero = '123';
  colonia = 'Roma Sur';
  cp = '06760';
  muni = 'Cuauhtémoc';
  estado = 'Ciudad de México';
  pais = 'México';
  rol = ''
  private readonly USER_KEY = 'app_user';
  constructor(
    private route: ActivatedRoute,
    private saldosservice: SaldosService,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private zone: NgZone,
    private ui: UiService
  ) {
    this.formularioaadminsinincidencia = this.fb.group({
      // Datos básicos
      confirmacionCliente: [''],
      nombreCorto: [''],
      cuentaOracle: [''],
      razonSocial: [''],

      // Cartera (números)
      carteraTotal: [''],
      carteraPorVencer: [''],
      carteraVencida: [''],
      vencida7: [''],
      vencida8a14: [''],
      vencida15a21: [''],
      vencida22Plus: [''],

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
    });

    this.formularioagenteEvidencias = this.fb.group({
      comentarios: [''],
      estatusName: [0],
    });
  }
  fmtMXN = (v: any) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(Number(v ?? 0));
  async ngOnInit(): Promise<void> {
    const v = this.route.snapshot.paramMap.get('id');
    const w = this.route.snapshot.paramMap.get('flag');
    this.id = v ? Number(v) : NaN;
    this.flag = w ? Number(w) : NaN;
    const idgrupo = localStorage.getItem('id_grupo');
    this.rol = localStorage.getItem('id_rol') ?? '0'

    if(this.rol == '3'){
     this.setMenuAdmin()
    }else{
      this.setMenu();

    }
    if (idgrupo == '1') {
      this.primerbloque = true;
      this.segundobloque = false;
    } else if (idgrupo == '2') {
      this.primerbloque = false;
      this.segundobloque = true;
    } else {
      this.primerbloque = true;
      this.segundobloque = true;
    }
    this.saldosservice.getEvidenciaBlob(this.id).subscribe({
      next: (resp) => {
        const blob = resp.body as Blob;
        const ct = (resp.headers.get('Content-Type') || '').toLowerCase();
        this.downloadName =
          this.filenameFromDisposition(
            resp.headers.get('Content-Disposition')
          ) || this.downloadName;

        this.objectUrl = URL.createObjectURL(blob);
        this.evidenciaexiste = true;
        if (ct.startsWith('image/')) {
          this.kind = 'image';
          this.imgUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
        } else if (ct === 'application/pdf') {
          this.kind = 'pdf';
          // Para iframe/object usa ResourceUrl
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.objectUrl
          );
        } else {
          this.kind = 'other';
        }
        this.loadings = false;
      },
      error: () => (this.loading = false),
    });
    this.saldosservice.getFirmaBlob(this.id).subscribe({
      next: (blob) => {
        console.log(blob);
        this.firmaObjectUrl = URL.createObjectURL(blob);
        this.firmaSafeUrl = this.sanitizer.bypassSecurityTrustUrl(
          this.firmaObjectUrl
        ); // crea URL temporal
        this.cargandos = false;
        this.visibleBtnGuardar = false;
      },
      error: (_) => {
        this.visibleBtnGuardar = true;
        this.cargandos = true;
      },
    });

    await this.cargaSecuencial();
    await this.buildMapp();
  }
  ngAfterViewInit(): void {}

   setMenu(){
    this.ui.showNavbar(true)
              this.ui.showAdmin(true)
              this.ui.showHeaderset(true)
              this.ui.showrRepresentante(false)
  }
  setMenuAdmin(){
    this.ui.showNavbar(true)
              this.ui.showAdmin(false)
              this.ui.showHeaderset(true)
              this.ui.showrRepresentante(false)
              this.ui.showAdminDownSet(true)
  }
  setPosition(lat: number, lng: number) {}

  ngOnDestroy(): void {}

  formatMoneyRegex(txt: number | string | null | undefined): string {
    if (txt == null) return '';

    let s = String(txt).replace(/[^\d.,-]/g, '');

    const negative = s.trim().startsWith('-');
    s = s.replace(/-/g, '');

    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma !== -1 && lastDot !== -1) {
      const last = Math.max(lastComma, lastDot);
      s = s.replace(/[.,]/g, (m, i) => (i === last ? '.' : ''));
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
  private filenameFromDisposition(cd: string | null): string | null {
    if (!cd) return null;
    // Content-Disposition: inline; filename="algo.pdf"
    const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd);
    return m ? decodeURIComponent(m[1].replace(/"/g, '')) : null;
  }
  /* Funcion de carga secuencial */
  async cargaSecuencial() {
    try {
      // 1) Traer la cuenta (elige endpoint según flag)
      const dto = await this.saldosservice[
        this.flag === 1
          ? 'consultaporidecuentaconincidencia'
          : 'consultaporidecuentasinincidencia'
      ](this.id)
        .pipe(take(1))
        .toPromise();

      if (!dto) {
        /* sin datos */ return;
      }

      this.patchCuenta(dto);

      // 2) Traer preguntas (si aplica) y parchar
      if (this.flag === 1) {
        this.mostrarEvidencia = true;
        this.mostrartextareas = true;
        const preg = await this.saldosservice
          .consultaregistroPreguntas(this.id)
          .pipe(take(1))
          .toPromise();
        if (preg) this.patchPreguntas(dto);
      } else {
        this.mostrarEvidencia = false;
        this.mostrartextareas = false;
        this.patchPreguntas(dto);
      }
    } catch (e) {
      console.error(e);
      // manejar 404/400 aquí
    }
  }
  private patchCuenta(dto: any) {
    console.log(dto);
    this.latitud = dto[0].lat;
    this.longitud = dto[0].long;
    this.iddelestatus = dto[0].id_estatus_cuenta
    this.formularioagenteEvidencias.patchValue({
      estatusName: dto[0].id_estatus_cuenta ?? 0
    })
    this.formularioaadminsinincidencia.patchValue(
      {
        confirmacionCliente: dto[0].otp ?? '',
        nombreCorto: dto[0].nombre_corto ?? '',
        cuentaOracle: dto[0].cuenta_oracle ?? '',
        razonSocial: dto[0].cliente ?? '',
        carteraTotal: '$ ' + this.formatMoneyRegex(dto[0].total_cartera ?? 0),
        carteraPorVencer: '$ ' + this.formatMoneyRegex(dto[0].por_vencer ?? 0),
        carteraVencida: '$ ' + this.formatMoneyRegex(dto[0].vencido ?? 0),
        vencida7: '$ ' + this.formatMoneyRegex(dto[0].vencido_7_dias ?? 0),
        vencida8a14:
          '$ ' + this.formatMoneyRegex(dto[0].vencido_8_14_dias ?? 0),
        vencida15a21:
          '$ ' + this.formatMoneyRegex(dto[0].vencido_15_21_dias ?? 0),
        vencida22Plus:
          '$ ' + this.formatMoneyRegex(dto[0].vencido_22_28_dias ?? 0),
      },
      { emitEvent: false }
    );
    this.comentarios = dto[0].comentarios;
  }
  patchPreguntas(src: any) {
    console.log(src);
    this.formularioaadminsinincidencia.patchValue(
      {
        p1_razon: src[0].p1_razon ?? '',
        p2_razon: src[0].p2_razon ?? '',
        p3_razon: src[0].p3_razon ?? '',
        p4_razon: src[0].p4_razon ?? '',
        p5_razon: src[0].p5_razon ?? '',
      },
      { emitEvent: false }
    );

    this.patchRadioAndMaybeDisable('acuerdoSaldo', src[0].p1);
    this.patchRadioAndMaybeDisable('comprobantePagos', src[0].p2);
    this.patchRadioAndMaybeDisable('pagosPendientes', src[0].p3);
    this.patchRadioAndMaybeDisable('devolucionesPendientes', src[0].p4);
    this.patchRadioAndMaybeDisable('reclamacionesPendientes', src[0].p5);
  }

  consultaRegistros() {
    this.saldosservice.consultaporidecuentasinincidencia(this.id).subscribe({
      next: (dto) => {
        console.log(dto);

        // dto es el objeto que pegaste en el mensaje
        this.formularioaadminsinincidencia.patchValue({
          // Datos básicos
          confirmacionCliente: dto.otp ?? '',
          nombreCorto: dto.nombre_corto ?? '',
          cuentaOracle: dto.cuenta_oracle ?? '',
          razonSocial: dto.cliente ?? '',

          // Cartera
          carteraTotal: '$ ' + this.formatMoneyRegex(dto.total_cartera),
          carteraPorVencer: '$ ' + this.formatMoneyRegex(dto.por_vencer),
          carteraVencida: '$ ' + this.formatMoneyRegex(dto.vencido),
          vencida7: '$ ' + this.formatMoneyRegex(dto.vencido_7_dias),
          vencida8a14: '$ ' + this.formatMoneyRegex(dto.vencido_8_14_dias),
          vencida15a21: '$ ' + this.formatMoneyRegex(dto.vencido_15_21_dias),
          vencida22Plus: '$ ' + this.formatMoneyRegex(dto.vencido_22_28_dias),

          p1_razon: dto.p1_razon,
          p2_razon: dto.p2_razon,
          p3_razon: dto.p3_razon,
          p4_razon: dto.p4_razon,
          p5_razon: dto.p5_razon,
        });
      },
      error: (err) => console.error(err),
    });
  }
  toTriBool(v: any): boolean | null {
    if (v === 1 || v === true) return true;
    if (v === 0 || v === false) return false;
    return null; // null, undefined, '' => sin selección
  }
  patchRadioAndMaybeDisable(ctrlName: string, rawValue: any) {
    const tri = this.toTriBool(rawValue);
    const ctrl = this.formularioaadminsinincidencia.get(ctrlName)!;
    ctrl.patchValue(tri, { emitEvent: false });
    if (tri !== null) {
      ctrl.disable({ emitEvent: false }); // ya había dato → bloquear
    } else {
      ctrl.enable({ emitEvent: false }); // sin dato → editable
    }
  }

  volver() {
    this.router.navigate(['/admin']);
  }
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(',')[1]); // solo la parte Base64
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  async grabarRespuestas() {
    const f = this.formularioagenteEvidencias.value;
    let usuario;
    this.auth.user$.pipe(take(1)).subscribe((u) => {
      console.log('username:', u?.username);
      usuario = u?.username ?? '';
    });
    let evidencia: any = null;
    if (this.archivoSeleccionado) {
      const b64 = await this.fileToBase64(this.archivoSeleccionado);
      evidencia = {
        fileName: this.archivoSeleccionado.name,
        contentType: this.archivoSeleccionado.type,
        dataBase64: b64,
      };
    }

    const payload = {
      uiRowCuenta: this.id,
      comentarios: f.comentarios ?? '',
      evidencia,
      usuario,
      estatus: f.estatusName
    };

    this.saldosservice.enviarIncidenciaBase64(payload).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'Listo!',
          text: 'Datos guardados',
          icon: 'success',
        });
        this.router.navigate(['/admin']);
      },
      error: (e) => {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: e,
        });
      },
    });
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.archivoSeleccionado = input.files[0];
    // Si quieres, guarda solo el nombre en el form:
    this.formularioagenteEvidencias.patchValue({
      evidencia: this.archivoSeleccionado.name,
    });
  }

  async buildMapp() {
    const address = `${this.calle} ${this.numero}, ${this.colonia}, ${this.cp} ${this.muni}, ${this.estado}, ${this.pais}`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}&addressdetails=1&limit=1&email=tu-correo@dominio.com`;

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const results = await res.json();

      if (!results.length) {
        console.warn('No se encontraron resultados para:', address);
        return;
      }

      const lat = parseFloat(this.latitud);
      const lon = parseFloat(this.longitud);

      // Inicializa mapa
      this.map = L.map(this.mapEl.nativeElement);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' +
          ' contributors',
      }).addTo(this.map);
      L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'assets/icons/markericon.png', // Tu ruta a la imagen de alta resolución (puedes usar la misma)
            iconUrl: 'assets/icons/markericon.png',       // Tu ruta a la imagen normal
            shadowUrl: 'assets/icons/markershadow.png',   // Tu ruta a la imagen de sombra
          });
      const target = L.latLng(lat, lon);
      this.map.setView(target, 18);
      this.marker = L.marker(target).addTo(this.map);

      // Click para mover marcador y actualizar coords (entra a Angular con zone.run)
      this.map.on('click', (e: any) => {
        if (this.marker) this.map.removeLayer(this.marker);
        this.marker = L.marker(e.latlng).addTo(this.map);

        this.zone.run(() => {
          console.log('Nueva posición:', e.latlng.lat, e.latlng.lng);
          // Si usas Reactive Forms:
          // this.form.patchValue({ lat: e.latlng.lat, lng: e.latlng.lng });
        });
      });
    } catch (err) {
      console.error('Error Nominatim:', err);
    }
  }
}
