import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { PagedResponse } from 'src/app/core/shared/PagedResponse.model';
import { RegistroCuentaApi } from 'src/app/core/shared/RegistroCuentaApi.model';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-estado-cuenta',
  templateUrl: './estado-cuenta.component.html',
  styleUrls: ['./estado-cuenta.component.css']
})
export class EstadoCuentaComponent implements OnInit {

  cuentaOracle: string = '';
  registros: RegistroCuentaApi[] = [];

  page: number = 1;
  pageSize: number = 10;
  totalPages: number = 0;
  total: number = 0;

  loading: boolean = false;
  errorMsg: string = '';
  exportando: boolean = false;

  constructor(private service: SaldosService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const cuentaParam = (params.get('idcuenta') ?? '').trim();

      if (!cuentaParam) {
        this.cuentaOracle = '';
        this.registros = [];
        this.total = 0;
        this.totalPages = 0;
        return;
      }

      if (cuentaParam !== this.cuentaOracle) {
        this.page = 1;
      }

      this.cuentaOracle = cuentaParam;
      this.buscar();
    });
  }

  buscar() {
    if (!this.cuentaOracle) return;

    this.loading = true;
    this.errorMsg = '';

    this.service
      .getByCuentaOraclePaged(this.cuentaOracle, this.page, this.pageSize)
      .subscribe({
        next: (resp: PagedResponse<RegistroCuentaApi>) => {
          this.registros = resp.data;
          this.total = resp.total;
          this.totalPages = resp.totalPages;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.registros = [];
          this.errorMsg = 'No fue posible consultar el estado de cuenta.';
          this.loading = false;
        }
      });
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.buscar();
  }

  get saldoVisible(): number {
    return this.registros.reduce((acc, item) => acc + Number(item.saldo_debido ?? 0), 0);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  formatFechaDisplay(value: string | null | undefined): string {
    if (!value) return 'Sin fecha';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(parsed);
  }

  // Exporta todos los movimientos de la cuenta (no solo la pagina visible) con las columnas de la tabla.
  async exportarExcel() {
    if (!this.cuentaOracle || this.exportando) return;
    this.exportando = true;
    try {
      const tamPagina = 500;
      const todos: RegistroCuentaApi[] = [];
      let pagina = 1;
      let totalPaginas = 1;
      do {
        const resp = await this.service.getByCuentaOraclePaged(this.cuentaOracle, pagina, tamPagina).toPromise();
        todos.push(...(resp?.data ?? []));
        totalPaginas = resp?.totalPages ?? 1;
        pagina++;
      } while (pagina <= totalPaginas);

      const filas = todos.map(item => ({
        'Cliente': item.cliente ?? '',
        'Documento': item.documento ?? '',
        'Importe': Number(item.importe_original ?? 0),
        'Saldo': Number(item.saldo_debido ?? 0)
      }));

      const ws = XLSX.utils.json_to_sheet(filas);
      ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 16 }, { wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Estado de cuenta');
      const fecha = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `EstadoCuenta_${this.cuentaOracle}_${fecha}.xlsx`);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No fue posible exportar el estado de cuenta.' });
    } finally {
      this.exportando = false;
    }
  }

  trackByRegistro(_: number, item: RegistroCuentaApi): number {
    return item.id_registro;
  }

}
