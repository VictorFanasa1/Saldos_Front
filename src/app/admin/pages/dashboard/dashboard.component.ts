import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import * as XLSX from 'xlsx';
import { from, of } from 'rxjs';
import { catchError, concatMap, finalize, take, tap } from 'rxjs/operators';
import { CuentasSaldosCreateRequest } from 'src/app/core/shared/cuentasaldoscreaterequest.model';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { AdmCuentasSaldos } from 'src/app/core/shared/cuentasagente.model';
import { IncidenciasRequest } from 'src/app/core/shared/cuentasrowResponse.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { UiService } from 'src/app/shared/service/ui.service';
import Swal from 'sweetalert2';
declare const $: any;
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dTable', {static: false}) dTable!: ElementRef<HTMLTableElement>;

   previewRows: CuentasSaldosCreateRequest[] = [];

     datoscuentaS: IncidenciasRequest [] = []
  uploading = false;
  progress = 0;
  versinincidencia= false;
  verconincidencia = false;
  verdasboard= true;
  loading = false;
  errorMsg = '';
  dt: any;
 showfirstcard= true;
   datoscuenta: IncidenciasRequest [] = []
   todayISO = this.toISODate(new Date());
maxInicioISO = this.toISODate(this.addMonths(new Date(), 3)); 
periodoInicio?: string;
periodoFin?: string;
rol = "0"
   private readonly USER_KEY = 'app_user';
  private readonly USER_ID = 'app_user_id';
  constructor(private excelSvc: SaldosService, private auth: AuthService, private router: Router, private ui: UiService, private cdr: ChangeDetectorRef) { }

get finMin(): string {
  return this.periodoInicio ?? this.todayISO;
}
get finMax(): string {
  const base = this.periodoInicio ? new Date(this.periodoInicio) : new Date();
  return this.toISODate(this.addMonths(base, 3));
}

// Cuando cambia el inicio, valida el fin
onInicioChange(value: string) {
  this.periodoInicio = value;
  // Si el fin actual queda fuera de rango, lo limpiamos
  if (this.periodoFin && (this.periodoFin < this.finMin || this.periodoFin > this.finMax)) {
    this.periodoFin = undefined;
  }
}

// Utilidades de fecha
private toISODate(d: Date): string {
  const tz = new Date(
    d.getFullYear(), d.getMonth(), d.getDate()
  ); // normaliza a medianoche local
  const y = tz.getFullYear();
  const m = (tz.getMonth() + 1).toString().padStart(2, '0');
  const day = tz.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

private addMonths(d: Date, months: number): Date {
  // Maneja fin de mes automáticamente (Date ajusta overflow)
  return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
}
  openPicker() {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  normHeader(s: string): string {
    const mapAcentos: Record<string, string> = {
      Á:'A', É:'E', Í:'I', Ó:'O', Ú:'U',
      á:'a', é:'e', í:'i', ó:'o', ú:'u',
      Ü:'U', ü:'u', Ñ:'N', ñ:'n'
    };
    const sinAcentos = s.replace(/[ÁÉÍÓÚÜÑáéíóúüñ]/g, (m) => mapAcentos[m] || m);
    return sinAcentos.replace(/\s+/g, ' ').trim().toUpperCase();
  }

  n(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isFinite(val) ? val : 0;
    const s = String(val).replace(/[\$\s,%]/g, '');
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
  }

  get(row: any, header: string): any {
    // row viene con llaves tal cual el header del Excel
    // buscamos una coincidencia "normalizada"
    const target = this.normHeader(header);
    for (const k of Object.keys(row)) {
      if (this.normHeader(k) === target) return row[k];
    }
    return null;
  }

  buildPayload(row: any, filaOrigen: number): CuentasSaldosCreateRequest {
    const now = new Date().toISOString();
    //alert(this.periodoInicio)
    //alert(this.periodoFin)
    // Mapeo según tus headers EXACTOS
    // CLIENTE, NOMBRE CORTO, CUENTA ORACLE, RETENCION CREDITO, TERMINO PAGO, LIMITE CREDITO,
    //  TOTAL CARTERA ,  POR VENCER ,  VENCIDO ,  VENCIDO 7 DIAS ,  VENCIDO 8 A 14 DIAS ,
    //  VENCIDO 15 A 21 DIAS ,  VENCIDO 22 A 28 DIAS ,  TOTAL CREDITO ,  PAGOS NO APLICADOS ,
    // SUCURSAL, DEPOSITO, CLASE CLIENTE, PERFIL CLIENTE, NOMBRE CADENA, PERFIL CREDITO,
    // TIPO CARTERA, COBRADOR, ZONA, VENDEDOR, TERRITORIO VENTAS, BRICK KNB, BRICK IMS,
    // GERENCIA DIVISIONAL, GERENTE DIVISIONAL, GERENCIA TERRITORIAL, GERENTE TERRITORIAL,
    // GERENCIA ZONA, GERENTE ZONA, CANAL VENTA, PROYECTO ESTRATEGICO, ESTATUS CUENTA

    return {
      sCliente: String(this.get(row, 'CLIENTE') ?? '').trim(),
      sNombreCorto: String(this.get(row, 'NOMBRE CORTO') ?? '').trim(),
      sCuentaOracle: String(this.get(row, 'CUENTA ORACLE') ?? '').trim(),
      dRetencionCredito: this.n(this.get(row, 'RETENCION CREDITO')),
      sTerminoPago: String(this.get(row, 'TERMINO PAGO') ?? '').trim(),
      dLimiteCredito: this.n(this.get(row, 'LIMITE CREDITO')),
      dTotalCartera: this.n(this.get(row, 'TOTAL CARTERA')),
      dPorVencer: this.n(this.get(row, 'POR VENCER')),
      dVencido: this.n(this.get(row, 'VENCIDO')),
      dVencido7Dias: this.n(this.get(row, 'VENCIDO 7 DIAS')),
      dVencido8a14Dias: this.n(this.get(row, 'VENCIDO 8 A 14 DIAS')),
      dVencido15a21Dias: this.n(this.get(row, 'VENCIDO 15 A 21 DIAS')),
      dVencido22a28Dias: this.n(this.get(row, 'VENCIDO 22 A 28 DIAS')),
      dTotalCredito: this.n(this.get(row, 'TOTAL CREDITO')),
      dPagosNoAplicados: this.n(this.get(row, 'PAGOS NO APLICADOS')),
      sSucursal: String(this.get(row, 'SUCURSAL') ?? '').trim(),
      sDeposito: String(this.get(row, 'DEPOSITO') ?? '').trim(),
      sClaseCliente: String(this.get(row, 'CLASE CLIENTE') ?? '').trim(),
      sPerfilCliente: String(this.get(row, 'PERFIL CLIENTE') ?? '').trim(),
      sNombreCadena: String(this.get(row, 'NOMBRE CADENA') ?? '').trim(),
      sPerfilCredito: String(this.get(row, 'PERFIL CREDITO') ?? '').trim(),
      sTipoCartera: String(this.get(row, 'TIPO CARTERA') ?? '').trim(),
      sCobrador: String(this.get(row, 'COBRADOR') ?? '').trim(),
      sZona: String(this.get(row, 'ZONA') ?? '').trim(),
      sVendedor: String(this.get(row, 'VENDEDOR') ?? '').trim(),
      sTerritorioVentas: String(this.get(row, 'TERRITORIO VENTAS') ?? '').trim(),
      sBrickKnb: String(this.get(row, 'BRICK KNB') ?? '').trim(),
      sBrickIms: String(this.get(row, 'BRICK IMS') ?? '').trim(),
      sGerenciaDivisional: String(this.get(row, 'GERENCIA DIVISIONAL') ?? '').trim(),
      sGerenteDivisional: String(this.get(row, 'GERENTE DIVISIONAL') ?? '').trim(),
      sGerenciaTerritorial: String(this.get(row, 'GERENCIA TERRITORIAL') ?? '').trim(),
      sGerenteTerritorial: String(this.get(row, 'GERENTE TERRITORIAL') ?? '').trim(),
      sGerenciaZona: String(this.get(row, 'GERENCIA ZONA') ?? '').trim(),
      sGerenteZona: String(this.get(row, 'GERENTE ZONA') ?? '').trim(),
      sCanalVenta: String(this.get(row, 'CANAL VENTA') ?? '').trim(),
      sProyectoEstrategico: String(this.get(row, 'PROYECTO ESTRATEGICO') ?? '').trim(),
      sEstatusCuenta: String(this.get(row, 'ESTATUS CUENTA') ?? '').trim(),
      sCorreo: String(this.get(row, 'CORREO') ?? '').trim(),
      sTelefono: String(this.get(row, 'TELEFONO') ?? '').trim(),
      susuario_registra: localStorage.getItem(this.USER_KEY),
      susuario_actualiza: '',
      // Flags/fechas
      bProcesado: false,         // o true si así lo deseas
      dtCreate: now,
      dtModificacion: now,
      periodo_inicio : this.periodoInicio ?? '',
      periodo_fin: this.periodoFin ?? ''
    };
  }


  ngOnInit(): void {

    this.rol = localStorage.getItem('id_rol') ?? '0'

    if(this.rol == '3'){
      this.setMenuAdmin()
      this.showfirstcard = false
    }else{
      this.setMenu();
      this.showfirstcard = true
    }

  }
  setMenu(){
    this.ui.showNavbar(true)
              this.ui.showAdmin(true)
              this.ui.showHeaderset(true)
              this.ui.showrRepresentante(false)
               this.ui.showAdminDownSet(false)
  }
  setMenuAdmin(){
    this.ui.showNavbar(true)
              this.ui.showAdmin(false)
              this.ui.showHeaderset(true)
              this.ui.showrRepresentante(false)
              this.ui.showAdminDownSet(true)
  }
  ngAfterViewInit(){
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
  }
  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array((e.target as any).result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });

      const ws = wb.Sheets[wb.SheetNames[0]];
      // Tomamos objetos por encabezado (+ defval para no perder vacíos)
      const rowsRaw = XLSX.utils.sheet_to_json<any>(ws, {
        defval: null,
        raw: false,
        dateNF: 'yyyy-mm-dd'
      });

      // Mapeo a tu payload
      this.previewRows = rowsRaw.map((r: any, idx: number) =>
        this.buildPayload(r, idx + 2)
      );
    };

    reader.readAsArrayBuffer(file);
  }

   subir() {

    if(this.periodoInicio == undefined || this.periodoFin == undefined){
      Swal.fire({
        icon: "info",
        title: "No se puede cargar el archivo si no defines un periodo"
      })
      return;
    }
    if (!this.previewRows.length || this.uploading) return;

    const chunkSize = 200;
    const chunks: CuentasSaldosCreateRequest[][] = [];
    for (let i = 0; i < this.previewRows.length; i += chunkSize) {
      chunks.push(this.previewRows.slice(i, i + chunkSize));
    }

    this.uploading = true;
    this.progress = 0;
    console.log(chunks)
    from(chunks)
      .pipe(
        concatMap((chunk, idx) =>
          this.excelSvc.create(chunk).pipe(
            tap(() => {
              this.progress = Math.round(((idx + 1) / chunks.length) * 100);
            }),
            catchError(err => {
              console.log(err)
              Swal.fire({
                icon: "error",
                title:"Ya existe un periodo"
              })
              // continuar sin romper todo:
              return of(null);
            })
          )
        ),
        finalize(() => (this.uploading = false))
      )
      .subscribe();
  }

  mostrarincidencias(){


    if(this.verconincidencia){
      this.verconincidencia = false
      this.verdasboard = true;
    }else{
      this.verconincidencia = true
      this.verdasboard = false;
      if(this.rol === "3"){
        this.excelSvc.consultaporidecuentaconincidenciaAll('').subscribe({
          next: (res)=>{
          this.datoscuenta = res
          console.log(res)
          this.buildDT();
        },
        error: (err) => {
          //this.errorMsg = 'Error cargando datos';
          console.error(err);
        },
        complete: () => (this.loading = false),
        })
      }else{
         let usuario
          this.auth.user$.pipe(take(1)).subscribe(u => {
                console.log('username:', u?.username);
                usuario = this.apellidosLuegoNombres(u?.username ?? '')
              });
      this.excelSvc.consultaporidecuentaconincidenciabygerente(usuario ?? '' ).subscribe({
          next: (res)=>{
          this.datoscuenta = res
          console.log(res)
          this.buildDT();
        },
        error: (err) => {
          //this.errorMsg = 'Error cargando datos';
          console.error(err);
        },
        complete: () => (this.loading = false),
        })
      }

      }
  }
  mostrarsinincidencias(){
    let ubicacion :string | null = null;
      ubicacion = localStorage.getItem('ubicacion')
      const ubicacionSegura = ubicacion ?? ''; 
    if(this.versinincidencia){
      this.versinincidencia = false
      this.verdasboard = true;
    }else{
      this.versinincidencia = true
      this.verdasboard = false;
      if(this.rol === "3"){
        this.excelSvc.consultaporidecuentasinincidenciaAll(ubicacionSegura).subscribe({
          next: (res)=>{
          this.datoscuentaS = res
          this.buildDT();
        },
        error: (err) => {
          //this.errorMsg = 'Error cargando datos';
          console.error(err);
        },
        complete: () => (this.loading = false),
        })
      }else{
        let usuario
          this.auth.user$.pipe(take(1)).subscribe(u => {
                console.log('username:', u?.username);
                usuario = this.apellidosLuegoNombres(u?.username ?? '')
              });
      this.excelSvc.consultaporidecuentasinincidenciabygerente(usuario ?? '' ).subscribe({
          next: (res)=>{
          this.datoscuentaS = res
          this.buildDT();
        },
        error: (err) => {
          //this.errorMsg = 'Error cargando datos';
          console.error(err);
        },
        complete: () => (this.loading = false),
        })
      }

    }
  }

  mostrardash(){
    this.verdasboard = true;
    this.versinincidencia = false
    this.verconincidencia = false
  }

  goToDetalleS(id: Number){

  }

  goToDetalle(id: Number, flag: number){
    this.router.navigate(['admin/fomrAdmin', id, flag]);
    this.destroyDT()
  }
onProcesadoChange(item: IncidenciasRequest, checked: boolean) {
    item.procesado = checked;

  }


  buildDT(): void {
    const $table = $(this.dTable.nativeElement);
    // Evita reinit:
    if ($.fn.DataTable.isDataTable(this.dTable.nativeElement)) {
      $table.DataTable().clear().destroy();
    }
    // Espera a que Angular pinte las filas
    setTimeout(() => {
      this.dt = $table.DataTable({
        responsive: true,
        autoWidth: false,
        pageLength: 25,
        lengthMenu: [10, 25, 50, 100],
        order: [[0, 'asc']], // # (uiRow) desc
        language: {
          processing: 'Procesando...',
          search: 'Buscar:',
          lengthMenu: 'Mostrar _MENU_',
          info: 'Mostrando _START_ a _END_ de _TOTAL_',
          infoEmpty: 'Mostrando 0 a 0 de 0',
          infoFiltered: '(filtrado de _MAX_)',
          loadingRecords: 'Cargando...',
          zeroRecords: 'No se encontraron registros',
          emptyTable: 'Sin datos',
          paginate: { first: 'Primero', previous: 'Anterior', next: 'Siguiente', last: 'Último' }
        }
        // Si quieres exportar:
        // dom: 'Bfrtip',
        // buttons: [{ extend: 'excel', text: 'Exportar Excel' }, { extend: 'csv', text: 'CSV' }, { extend: 'print', text: 'Imprimir' }]
      });
    }, 0);
  }


  destroyDT(): void {
    if (this.dt) {
      this.dt.destroy(true);
      this.dt = null;
    }
  }

  apellidosLuegoNombres(full: string): string {
  if (!full?.trim()) return '';
  const parts = full.trim().replace(/\s+/g, ' ').split(' ');
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`; // 2 palabras: invierte

  const particles = new Set([
    'de','del','de la','de los','de las','la','las','los','lo','y','da','das','do','dos','van','von','di','du'
  ]);

  // Unir partículas multi-palabra antes de procesar
  const joined: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const two = (parts[i] + ' ' + (parts[i+1] ?? '')).toLowerCase();
    if (particles.has(two.trim())) {
      joined.push(parts[i] + ' ' + parts[i+1]); i++; // consume 2
    } else {
      joined.push(parts[i]);
    }
  }

  // Tomar 2 apellidos (no-partículas) desde el final, incluyendo partículas contiguas
  const surnames: string[] = [];
  let nonParticleCount = 0;
  let i = joined.length - 1;

  const isParticle = (s: string) => particles.has(s.toLowerCase());
  while (i >= 0 && nonParticleCount < 2) {
    surnames.unshift(joined[i]);
    if (!isParticle(joined[i])) nonParticleCount++;
    i--;
  }
  // Incluye partículas extra pegadas a la izquierda (p.ej. "de la" + "cruz")
  while (i >= 0 && isParticle(joined[i])) {
    surnames.unshift(joined[i]); i--;
  }

  const names = joined.slice(0, i + 1).join(' ');
  return (surnames.join(' ') + (names ? ' ' + names : '')).trim();
}

logoutSys(){
  this.auth.logout()
   this.router.navigate(['login']);
}
goconfig(){
  this.router.navigate(['admin/configuraciones']);
}
}
