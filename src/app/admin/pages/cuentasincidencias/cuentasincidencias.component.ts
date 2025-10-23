import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { IncidenciasRequest } from 'src/app/core/shared/cuentasrowResponse.model';
import { UiService } from 'src/app/shared/service/ui.service';
declare const $: any;
@Component({
  selector: 'app-cuentasincidencias',
  templateUrl: './cuentasincidencias.component.html',
  styleUrls: ['./cuentasincidencias.component.css'],
})
export class CuentasincidenciasComponent implements OnInit {
  @ViewChild('dTable', { static: false }) dTable!: ElementRef<HTMLTableElement>;
  datoscuentaS: IncidenciasRequest[] = [];
  rol = '0';
  loading = false;
  dt: any;
  constructor(
    private excelSvc: SaldosService,
    private auth: AuthService,
    private router: Router,
    private ui: UiService
  ) {}

  ngOnInit(): void {
     this.rol = localStorage.getItem('id_rol') ?? '0'
    this.setData();


    if(this.rol == '3'){
      this.setMenuAdmin()

    }else{
      this.setMenu();

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

  setData() {
    if (this.rol === '3') {
      this.excelSvc.consultaporidecuentasinincidenciaAll().subscribe({
        next: (res) => {
          this.datoscuentaS = res;
          this.buildDT();
        },
        error: (err) => {
          //this.errorMsg = 'Error cargando datos';
          console.error(err);
        },
        complete: () => (this.loading = false),
      });
    } else {
      let usuario;
      this.auth.user$.pipe(take(1)).subscribe((u) => {
        console.log('username:', u?.username);
        usuario = this.apellidosLuegoNombres(u?.username ?? '');
      });
      this.excelSvc
        .consultaporidecuentasinincidenciabygerente(usuario ?? '')
        .subscribe({
          next: (res) => {
            this.datoscuentaS = res;
            this.buildDT();
          },
          error: (err) => {
            //this.errorMsg = 'Error cargando datos';
            console.error(err);
          },
          complete: () => (this.loading = false),
        });
    }
  }
  loadMenu() {
    this.ui.showNavbar(true);
    this.ui.showAdmin(true);
    this.ui.showHeaderset(true);
    this.ui.showrRepresentante(false);
  }
  goToDetalle(id: Number, flag: number) {
    this.router.navigate(['admin/fomrAdmin', id, flag]);
    this.destroyDT();
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
          paginate: {
            first: 'Primero',
            previous: 'Anterior',
            next: 'Siguiente',
            last: 'Último',
          },
        },
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
      'de',
      'del',
      'de la',
      'de los',
      'de las',
      'la',
      'las',
      'los',
      'lo',
      'y',
      'da',
      'das',
      'do',
      'dos',
      'van',
      'von',
      'di',
      'du',
    ]);

    // Unir partículas multi-palabra antes de procesar
    const joined: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const two = (parts[i] + ' ' + (parts[i + 1] ?? '')).toLowerCase();
      if (particles.has(two.trim())) {
        joined.push(parts[i] + ' ' + parts[i + 1]);
        i++; // consume 2
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
      surnames.unshift(joined[i]);
      i--;
    }

    const names = joined.slice(0, i + 1).join(' ');
    return (surnames.join(' ') + (names ? ' ' + names : '')).trim();
  }
}
