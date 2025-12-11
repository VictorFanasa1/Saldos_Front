import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { AdmCuentasSaldos } from 'src/app/core/shared/cuentasagente.model';
import { getregistrossaldogerente } from 'src/app/core/shared/cuentasaldosporgerente.model';
import { UiService } from 'src/app/shared/service/ui.service';
declare const $: any;


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponentAgent implements OnInit {

  @ViewChild('dTable', {static: false}) dTable!: ElementRef<HTMLTableElement>;

  datoscuenta: AdmCuentasSaldos [] = []
  loading = false;
  errorMsg = '';
  dt: any;

  constructor(private router: Router, private saldosservice: SaldosService, private auth: AuthService, private ui: UiService) {
    this.ui.showHeaderset(true)
  }

  ngAfterViewInit(): void{

     if (this.datoscuenta.length) { this.buildDT(); }
  }

  ngOnInit(): void {

    this.getRegistros()
    //this.ui.showAdmin(false)
    //this.ui.showAdminDownSet(false)
    this.ui.showrRepresentante(true)
  }
 ngOnDestroy(): void {
    this.destroyDT();
  }
  getRegistros(){
    let usuario = localStorage.getItem('useridbd')
    
        const usuraioDto : getregistrossaldogerente = {
          gerenteZona : usuario ?? ''
        }

    this.saldosservice.consultaPorgerenteZona(usuraioDto).subscribe({
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

  onProcesadoChange(item: AdmCuentasSaldos, checked: boolean) {
    item.bProcesado = checked;

  }

  goToDetalle(id: number) {
    this.router.navigate(['agente/fomrAgente', id]); // /cuentas/:id
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

}
