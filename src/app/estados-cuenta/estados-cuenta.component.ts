import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { from, of } from 'rxjs';
import { concatMap, tap, catchError, finalize, take } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { AuthService } from '../core/services/auth.service';
import { SaldosService } from '../core/services/saldos.service';
import { RegistroCuentaApi } from '../core/shared/RegistroCuentaApi.model';
import { IncidenciasRequest } from '../core/shared/cuentasrowResponse.model';
import { UiService } from '../shared/service/ui.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-estados-cuenta',
  templateUrl: './estados-cuenta.component.html',
  styleUrls: ['./estados-cuenta.component.css']
})
export class EstadosCuentaComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('dTable', {static: false}) dTable!: ElementRef<HTMLTableElement>;
  
     previewRows: RegistroCuentaApi[] = [];
  
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
    constructor(private excelSvc: SaldosService, private route: ActivatedRoute, private auth: AuthService, private router: Router, private ui: UiService, private cdr: ChangeDetectorRef) { }
  
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
    // Maneja fin de mes automÃ¡ticamente (Date ajusta overflow)
    return new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  }
    openPicker() {
      this.fileInput.nativeElement.value = '';
      this.fileInput.nativeElement.click();
    }
  
    normHeader(s: string): string {
      return String(s ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
    }

    n(val: any): number {
      if (val === null || val === undefined || val === '') return 0;
      if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return Number.isNaN(num) ? 0 : num;
    }

    get(row: any, header: string): any {
      const target = this.normHeader(header);
      for (const k of Object.keys(row ?? {})) {
        if (this.normHeader(k) === target) return row[k];
      }
      return null;
    }

    getAny(row: any, headers: string[]): any {
      for (const h of headers) {
        const value = this.get(row, h);
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          return value;
        }
      }
      return null;
    }

    buildPayload(row: any): RegistroCuentaApi {
      return {
        id_registro: 0,
        sucursal: String(this.get(row, 'Sucursal') ?? '').trim() || null,
        cobrador: String(this.get(row, 'Cobrador') ?? '').trim() || null,
        cliente: String(this.get(row, 'Cliente') ?? '').trim() || null,
        cuenta_oracle: String(this.getAny(row, ['Cuenta', 'Cuenta Oracle']) ?? '').trim() || null,
        perfil: String(this.get(row, 'Perfil') ?? '').trim() || null,
        documento: String(this.get(row, 'Documento') ?? '').trim() || null,
        tipo: String(this.get(row, 'Tipo') ?? '').trim() || null,
        origen: String(this.get(row, 'Origen') ?? '').trim() || null,
        fecha: String(this.get(row, 'Fecha') ?? '').trim() || null,
        fecha_vto: String(this.getAny(row, ['Fcha Vto', 'Fcha  Vto', 'Fecha Vto']) ?? '').trim() || null,
        status: String(this.getAny(row, ['Estatus', 'Status']) ?? '').trim() || null,
        dias_vto: this.n(this.getAny(row, ['Días Vto', 'Dias Vto', 'Días Vto'])),
        importe_original: this.n(this.get(row, 'Importe Original')),
        iva: this.n(this.getAny(row, ['IVA', 'Iva'])),
        saldo_debido: this.n(this.get(row, 'Saldo Debido'))
      };
    }

    ngOnInit(): void {
      this.reloadModule()
      this.rol = localStorage.getItem('id_rol') ?? '0'
     
      if(this.rol == '3' || this.rol == '4'){
        this.setMenuAdmin()
        this.showfirstcard = false
      }else{
        this.setMenu();
        this.showfirstcard = true
      }
  
    }
  
    reloadModule(){
      this.route.queryParams.subscribe(params => {
      if (!params['reloaded']) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { reloaded: 'true' },
          queryParamsHandling: 'merge'
        }).then(() => {
          location.reload(); // Recarga una vez y la URL tendrÃ¡ el parÃ¡metro
        });
      }
    });
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
        // Tomamos objetos por encabezado (+ defval para no perder vacÃ­os)
        const rowsRaw = XLSX.utils.sheet_to_json<any>(ws, {
          defval: null,
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
  
        // Mapeo a tu payload
        this.previewRows = rowsRaw.map((r: any) => this.buildPayload(r));
      };
  
      reader.readAsArrayBuffer(file);
    }
  
     subir() {
      if (!this.previewRows.length || this.uploading) return;
  
      const chunkSize = 200;
      const chunks: RegistroCuentaApi[][] = [];
      for (let i = 0; i < this.previewRows.length; i += chunkSize) {
        chunks.push(this.previewRows.slice(i, i + chunkSize));
      }
  
      this.uploading = true;
      this.progress = 0;
      console.log(chunks)
      from(chunks)
        .pipe(
          concatMap((chunk, idx) =>
            this.excelSvc.insertEdoCuenta(chunk).pipe(
              tap(() => {
                this.progress = Math.round(((idx + 1) / chunks.length) * 100);
              }),
              catchError(err => {
                console.log(err)
                Swal.fire({
                  icon: "error",
                  title:"Error al cargar el archivo"
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
                let ubicacion :string | null = null;
        ubicacion = localStorage.getItem('ubicacion')
        const ubicacionSegura = ubicacion ?? ''; 
        this.excelSvc.consultaporidecuentasinincidenciabygerente(usuario ?? '', ubicacionSegura ).subscribe({
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
  
    // Unir partÃ­culas multi-palabra antes de procesar
    const joined: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const two = (parts[i] + ' ' + (parts[i+1] ?? '')).toLowerCase();
      if (particles.has(two.trim())) {
        joined.push(parts[i] + ' ' + parts[i+1]); i++; // consume 2
      } else {
        joined.push(parts[i]);
      }
    }
  
    // Tomar 2 apellidos (no-partÃ­culas) desde el final, incluyendo partÃ­culas contiguas
    const surnames: string[] = [];
    let nonParticleCount = 0;
    let i = joined.length - 1;
  
    const isParticle = (s: string) => particles.has(s.toLowerCase());
    while (i >= 0 && nonParticleCount < 2) {
      surnames.unshift(joined[i]);
      if (!isParticle(joined[i])) nonParticleCount++;
      i--;
    }
    // Incluye partÃ­culas extra pegadas a la izquierda (p.ej. "de la" + "cruz")
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
  

