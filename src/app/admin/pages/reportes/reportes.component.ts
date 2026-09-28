import { Component, OnInit } from '@angular/core';
import { SaldosService } from 'src/app/core/services/saldos.service';
import { ReportePregunta } from 'src/app/core/shared/reportePreguntas.model';
import { exportarExcel } from 'src/app/shared/service/excel-export';
import { UiService } from 'src/app/shared/service/ui.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  fechaInicio = '';
  fechaFin = '';
  datos: ReportePregunta[] = [];
  generado = false;
  loading = false;
  errorMsg = '';

  busqueda = '';
  page = 1;
  readonly pageSize = 25;

  constructor(private saldosservice: SaldosService, private ui: UiService) {}

  ngOnInit(): void {
    const rol = localStorage.getItem('id_rol') ?? '0';
    if (rol == '3' || rol == '4') {
      this.setMenuAdmin();
    } else {
      this.setMenu();
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

  generar() {
    if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
      Swal.fire('Atención', 'La fecha inicio no puede ser mayor a la fecha fin.', 'info');
      return;
    }
    this.loading = true;
    this.errorMsg = '';
    this.saldosservice.getReportePreguntas(this.fechaInicio, this.fechaFin).subscribe({
      next: (res) => {
        this.datos = res ?? [];
        this.generado = true;
        this.busqueda = '';
        this.page = 1;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.datos = [];
        this.generado = true;
        this.errorMsg = 'No fue posible generar el reporte.';
        this.loading = false;
      }
    });
  }

  limpiar() {
    this.fechaInicio = '';
    this.fechaFin = '';
  }

  get filtrados(): ReportePregunta[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.datos;
    return this.datos.filter(r =>
      [r.folio_soporte, r.cuenta_oracle, r.usuario_registra, r.ubicacion, this.tipoIncidencia(r.tipo_incidencia)]
        .some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtrados.length / this.pageSize));
  }

  get paginaActual(): ReportePregunta[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtrados.slice(start, start + this.pageSize);
  }

  get conIncidencia(): number {
    return this.datos.filter(r => r.tipo_incidencia && r.tipo_incidencia !== '0').length;
  }

  get cierres(): number {
    return this.datos.filter(r => Number(r.cierre) === 1).length;
  }

  onBuscar() {
    this.page = 1;
  }

  cambiarPagina(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.page = p;
  }

  tipoIncidencia(v: string | null | undefined): string {
    switch (String(v ?? '')) {
      case '0': return 'Sin incidencia';
      case '1': return 'Crédito';
      case '2': return 'Ventas';
      default: return v ? String(v) : '';
    }
  }

  estatusTexto(v: string | null | undefined): string {
    switch (String(v ?? '')) {
      case '1': return 'Cerrado con incidencia';
      case '2': return 'Abierto - En seguimiento';
      default: return v ? String(v) : '';
    }
  }

  fechaTexto(v: string | null | undefined): string {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? String(v)
      : d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Exporta lo filtrado en pantalla con todas las columnas del reporte (sin rutas internas de firma/evidencia).
  exportar() {
    const filas = this.filtrados.map(r => ({
      'Folio': r.folio_soporte ?? '',
      'Cuenta Oracle': r.cuenta_oracle ?? '',
      'Ubicación': r.ubicacion ?? '',
      'Fecha de creación': this.fechaTexto(r.fecha_creacion),
      'Usuario registra': r.usuario_registra ?? '',
      'Gerente registro': r.nombre_gerente_registro ?? '',
      'OTP': r.otp ?? '',
      'Tipo de incidencia': this.tipoIncidencia(r.tipo_incidencia),
      'Estatus': this.estatusTexto(r.estatus),
      'Cierre de farmacia': r.cierre_farmacia ?? '',
      'P1 Acuerdo con saldo': r.p1 ?? '',
      'P1 Razón': r.p1_razon ?? '',
      'P2 Comprobante de pagos': r.p2 ?? '',
      'P2 Razón': r.p2_razon ?? '',
      'P3 Pagos pendientes': r.p3 ?? '',
      'P3 Razón': r.p3_razon ?? '',
      'P4 Devoluciones pendientes': r.p4 ?? '',
      'P4 Razón': r.p4_razon ?? '',
      'P5 Reclamaciones pendientes': r.p5 ?? '',
      'P5 Razón': r.p5_razon ?? '',
      'Comentarios': r.comentarios ?? '',
      'Usuario actualiza': r.usuario_actualiza ?? '',
      'Fecha de solución': this.fechaTexto(r.fecha_solucion),
      'Latitud': r.lat ?? '',
      'Longitud': r.longi ?? ''
    }));
    if (!filas.length) {
      Swal.fire('Atención', 'No hay registros para exportar.', 'info');
      return;
    }
    const rango = this.fechaInicio || this.fechaFin ? `_${this.fechaInicio || 'inicio'}_a_${this.fechaFin || 'hoy'}` : '_todo';
    exportarExcel(filas, 'Reporte', `ReportePreguntas${rango}`);
  }
}
