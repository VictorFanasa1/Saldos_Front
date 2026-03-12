import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { PagedResponse } from 'src/app/core/shared/PagedResponse.model';
import { RegistroCuentaApi } from 'src/app/core/shared/RegistroCuentaApi.model';

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

  trackByRegistro(_: number, item: RegistroCuentaApi): number {
    return item.id_registro;
  }

}
