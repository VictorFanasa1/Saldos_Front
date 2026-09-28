import { HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { UiService } from 'src/app/shared/service/ui.service';
import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { CuentasResponse } from 'src/app/core/shared/CuentasResponse.model';
import * as XLSX from 'xlsx';
declare const $: any;
@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dTable', {static: false}) dTable!: ElementRef<HTMLTableElement>;
  selectedFile: File | null = null;
  uploading = false;
  progress = 0;
  versinincidencia = false;
  verconincidencia = false;
  verdasboard = true;
  showfirstcard = true;
  showCargaInformacion = true;
  showKpis = false;

  periodoInicio?: string;
  periodoFin?: string;
  rol = '0';
  datacuentas: CuentasResponse[ ]= []
  // Filtro visual por mes: por defecto el mes en curso; null = todos.
  datosVisibles: CuentasResponse[] = [];
  mesesDisponibles: number[] = [];
  mesFiltro: number | null = null;
  mostrarFiltro = false;
    dt: any;
  private readonly USER_KEY = 'app_user';
  private readonly USER_ID = 'app_user_id';
  private readonly MAX_FILE_SIZE_MB = 400;

  constructor(
    private excelSvc: SaldosService,
    private auth: AuthService,
    private router: Router,
    private ui: UiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    
    this.rol = localStorage.getItem('id_rol') ?? '0';
    let ubicacion = localStorage.getItem('ubicacion') ?? ''
    this.excelSvc.consultaRegistrosCuentas(ubicacion).subscribe({
      next: respons =>{
        console.log(respons)
        this.datacuentas = respons ?? []
        this.mesesDisponibles = Array.from(new Set(
          this.datacuentas.map(c => this.mesNumero(c.mes)).filter((m): m is number => m !== null)
        )).sort((a, b) => a - b);
        const mesActual = new Date().getMonth() + 1;
        this.aplicarFiltroMes(this.mesesDisponibles.includes(mesActual) ? mesActual : null);
      }
    })
    if (this.rol == '3' || this.rol == '4') {
      this.setMenuAdmin();
      this.showfirstcard = false;
      
    }
    else {
      this.setMenu();
      this.showfirstcard = true;
    }
    console.log(localStorage.getItem('ubicacion'))
  }

  // El backend a veces manda el mes como numero (9) y a veces como nombre ("Septiembre"); solo es visual.
  nombreMes(mes: string | number | null | undefined): string {
    if (mes === null || mes === undefined || mes === '') return 'Sin mes';
    const n = Number(mes);
    if (!Number.isInteger(n) || n < 1 || n > 12) return String(mes);
    const txt = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date(2000, n - 1, 1));
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  }

  // Normaliza el mes (9, "9" o "Septiembre") a numero 1-12.
  mesNumero(mes: string | number | null | undefined): number | null {
    if (mes === null || mes === undefined || mes === '') return null;
    const n = Number(mes);
    if (Number.isInteger(n) && n >= 1 && n <= 12) return n;
    const limpio = String(mes).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const idx = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
      'septiembre', 'octubre', 'noviembre', 'diciembre'].indexOf(limpio);
    return idx >= 0 ? idx + 1 : (limpio === 'setiembre' ? 9 : null);
  }

  aplicarFiltroMes(mes: number | null) {
    this.mostrarFiltro = false;
    this.mesFiltro = mes;
    // DataTables se adueña del DOM de la tabla: se suelta antes de que Angular repinte las filas.
    if (this.dt) {
      this.dt.destroy();
      this.dt = null;
    }
    this.datosVisibles = mes === null
      ? [...this.datacuentas]
      : this.datacuentas.filter(c => this.mesNumero(c.mes) === mes);
    this.cdr.detectChanges();
    this.buildDT();
  }

  setMenu() {
    this.ui.showNavbar(true);
    this.ui.showAdmin(true);
    this.ui.showHeaderset(true);
    this.ui.showrRepresentante(false);
    this.ui.showAdminDownSet(false);
  }

  

  setMenuAdmin() {
    this.ui.showNavbar(true);
    this.ui.showAdmin(false);
    this.ui.showHeaderset(true);
    this.ui.showrRepresentante(false);
    this.ui.showAdminDownSet(true);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.cdr.detectChanges();
      if(this.datosVisibles.length && !this.dt) { this.buildDT();}
    }, 0);
  }

  ngOnDestroy(): void {
    this.destroyDT();
  }

  openPicker() {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  onFileSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > this.MAX_FILE_SIZE_MB) {
      Swal.fire({
        icon: 'warning',
        title: `El archivo es muy grande (${sizeMb.toFixed(1)} MB)`,
        text: `Limite permitido: ${this.MAX_FILE_SIZE_MB} MB.`
      });
      return;
    }

    this.selectedFile = file;
    this.progress = 0;
    Swal.fire({
      icon: 'info',
      title: 'Archivo listo para enviar',
      text: `${file.name} (${sizeMb.toFixed(1)} MB)`
    });
  }

  subir() {
    
    if (!this.selectedFile || this.uploading) return;

    this.uploading = true;
    this.progress = 0;
    this.excelSvc
      .uploadClientsFile(this.selectedFile)
      .pipe(
        tap((event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.progress = this.clampPercent(Math.round((100 * event.loaded) / event.total));
          }
          if (event.type === HttpEventType.Response) {
            this.progress = 100;
            Swal.fire({
              icon: 'success',
              title: 'Archivo enviado correctamente'
            });
            this.selectedFile = null;
            this.fileInput.nativeElement.value = '';
          }
        }),
        catchError((err) => {
          console.log(err);
          Swal.fire({
            icon: 'error',
            title: 'Error al enviar el archivo'
          });
          return of(null);
        }),
        finalize(() => (this.uploading = false))
      )
      .subscribe();
  }

   destroyDT(): void {
    if (this.dt) {
      this.dt.destroy(true);
      this.dt = null;
    }
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

  get totalGerentes(): number {
    return this.datosVisibles.length;
  }

  get totalAuditados(): number {
    return this.datosVisibles.reduce((sum, item) => sum + Number(item.clientes_auditados ?? 0), 0);
  }

  get totalRestantes(): number {
    return this.datosVisibles.reduce((sum, item) => sum + Number(item.clientes_restantes ?? 0), 0);
  }

  get promedioPorcentaje(): number {
    if (!this.datosVisibles.length) {
      return 0;
    }
    // porcentaje ya viene en escala 0-100 (auditados / cuota) y puede pasar de 100.
    const total = this.datosVisibles.reduce((sum, item) => sum + Number(item.porcentaje ?? 0), 0);
    return this.clampPercent(total / this.datosVisibles.length);
  }

  porcentajeCliente(item: CuentasResponse): number {
    return this.clampPercent(Number(item?.porcentaje ?? 0));
  }

  // Semáforo: <20 rojo suave, 20-49 amarillo, 50-99 azul, 100+ verde.
  nivelAvance(item: CuentasResponse): 'rojo' | 'amarillo' | 'azul' | 'verde' {
    const p = Number(item?.porcentaje ?? 0);
    if (p >= 100) return 'verde';
    if (p >= 50) return 'azul';
    if (p >= 20) return 'amarillo';
    return 'rojo';
  }

  private clampPercent(value: number): number {
    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }
    return Math.min(value, 100);
  }

  trackByCliente(index: number, item: CuentasResponse): string {
    return `${item.gerente ?? 'gerente'}-${item.periodo ?? 'periodo'}-${item.mes ?? index}`;
  }

  exportarExcel(): void {
    if (!this.datosVisibles.length) {
      Swal.fire({ icon: 'info', title: 'Sin datos', text: 'No hay información para exportar.' });
      return;
    }

    const filas = this.datosVisibles.map(item => ({
      Gerente: item.gerente ?? '',
      Periodo: item.periodo ?? '',
      Mes: this.nombreMes(item.mes),
      'Clientes asignados': item.clientes_asignados ?? 0,
      'Cuota mensual': item.cuota_mensual ?? 0,
      'Clientes auditados': item.clientes_auditados ?? 0,
      'Porcentaje': item.porcentaje ?? 0,
      'Clientes restantes': item.clientes_restantes ?? 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(filas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `clientes${this.mesFiltro !== null ? '_' + this.nombreMes(this.mesFiltro) : ''}_${fecha}.xlsx`);
  }
}
