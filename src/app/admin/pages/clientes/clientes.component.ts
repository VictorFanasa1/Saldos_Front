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

  periodoInicio?: string;
  periodoFin?: string;
  rol = '0';
  datacuentas: CuentasResponse[ ]= []
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
    this.excelSvc.consultaRegistrosCuentas().subscribe({
      next: respons =>{
        console.log(respons)
        this.datacuentas = respons
        this.buildDT();
      }
    })
    if (this.rol == '3') {
      this.setMenuAdmin();
      this.showfirstcard = false;
      
    } else {
      this.setMenu();
      this.showfirstcard = true;
    }
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
      if(this.datacuentas.length) { this.buildDT();}
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
            this.progress = Math.round((100 * event.loaded) / event.total);
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
}
