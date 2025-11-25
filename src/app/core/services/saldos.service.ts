import { SendMailBodyRequest } from './../shared/sendMailClient.Model';
import { HttpClient, HttpHeaders, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdmCuentasSaldos } from '../shared/cuentasagente.model';
import { CuentasSaldosCreateRequest } from '../shared/cuentasaldoscreaterequest.model';
import { CuentasSaldosProcesadoUpdateRequest } from '../shared/cuentassaldosprocesadoupdaterequest.model';
import { getregistrossaldogerente } from '../shared/cuentasaldosporgerente.model';
import { getRolUserRequest, UserRolResponse } from '../shared/UserResponseRol';
import { CuentasSaldosPreguntasDto } from '../shared/cuentasPreguentasRequest';
import { PreguntasResponse } from '../shared/preguntas.model';
import { IncidenciasRequest } from '../shared/cuentasrowResponse.model';
import { environment } from 'src/environments/environment.prod';
import { ClientsRequest } from '../shared/ClientsRequest.model';
import { CuentasResponse } from '../shared/CuentasResponse.model';

@Injectable({
  providedIn: 'root'
})
export class SaldosService{
     private readonly apiUrl = environment.apiUrl;
     private readonly apiUrlAuth = environment.apiUrlAuth;

    constructor(private http: HttpClient){}

    consultaRegistros():Observable<AdmCuentasSaldos[]> {
      return this.http.get<AdmCuentasSaldos[]>(`${this.apiUrl}/GetRegistros`);
    }
     consultaRegistrosCuentas():Observable<CuentasResponse[]> {
      return this.http.get<CuentasResponse[]>(`${this.apiUrl}/GetCuentasResponse`);
    }

    consultaregistroid(idCuenta: Number): Observable<AdmCuentasSaldos>{
      return this.http.get<AdmCuentasSaldos>(`${this.apiUrl}/GetById/${idCuenta}`);
    }

    consultaregistroPreguntas(idCuenta: Number): Observable<PreguntasResponse[]>{
      return this.http.get<PreguntasResponse[]>(`${this.apiUrl}/GetByIdPreguntas/${idCuenta}`);
    }

    getlastfolionumber(idCuenta: Number): Observable<string>{
       return this.http.get(`${this.apiUrl}/GetLastFolioNumber/${idCuenta}`, {
          responseType: 'text' as const
        });
    }

    consultaporidecuentaconincidencia(idCuenta: Number){
      return this.http.get<IncidenciasRequest>(`${this.apiUrl}/GetCuentaConPreguntasBySumFlag/${idCuenta}/${1}`);
    }

    consultaporidecuentaconincidenciaAll(){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetCuentaConPreguntasBySumFlagAll/${1}`);
    }
    consultaCredito(){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetCuentasCredito`);
    }

    consultaCobranza(){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetCuentasCobranza`);
    }
    
    enviarIncidenciaBase64(json: any){
      console.log(json)
      return this.http.post<any>(`${this.apiUrl}/UpdateCuenta`, json)
    }
    
    consultaporidecuentasinincidencia(idCuenta: Number){
      return this.http.get<IncidenciasRequest>(`${this.apiUrl}/GetCuentaConPreguntasBySumFlag/${idCuenta}/${0}`);
    }
    
    consultaporidecuentasinincidenciaAll(){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetCuentaConPreguntasBySumFlagAll/${0}`);
    }

     consultaporidecuentasinincidenciaAllD(){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetCuentaConPreguntasBySumFlagAll/${0}`);
    }
    consultaporidecuentaconincidenciabygerente(gerente: string){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetByGerenteZonaSumFlag/${gerente}/${1}`);
    }

    consultaporidecuentasinincidenciabygerente(gerente: string){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetByGerenteZonaSumFlag/${gerente}/${0}`);
    }
    consultaPorgerenteZona(payload: getregistrossaldogerente):Observable<AdmCuentasSaldos[]>{
      console.log(payload)
      return this.http.post<AdmCuentasSaldos[]>(`${this.apiUrl}/GetByGerenteZona`, payload);
    }
    create(payload: CuentasSaldosCreateRequest[]): Observable<AdmCuentasSaldos> {
      const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
      return this.http.post<AdmCuentasSaldos>(`${this.apiUrl}/Insert`, payload, {headers});
    }


  createClients(payload: ClientsRequest[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.apiUrl}/ClientRegister`, payload, {headers});
  }

  uploadClientsFile(file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<any>(`${this.apiUrl}/ClientRegisterFile`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

    registrarPeguntas(payload: CuentasSaldosPreguntasDto): Observable<any>{
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      return this.http.post<CuentasSaldosPreguntasDto>(`${this.apiUrl}/InsertPreguntar`, payload, {headers})
    }

    updateFechaProceso(req: {id: number}): Observable<{id: number;}>{
      return this.http.post<{id: number; bProcesado: boolean}>(`${this.apiUrl}/UpdateCuentas`, req)
    }
    
    updateProcesado(req: CuentasSaldosProcesadoUpdateRequest): Observable<{ id: number; bProcesado: boolean }> {
      return this.http.post<{ id: number; bProcesado: boolean }>(`${this.apiUrl}/actualizar-procesado`, req);
    }

    getRolUser(uiIdUsuario: getRolUserRequest): Observable<UserRolResponse>{

      return this.http.post<UserRolResponse>(`${this.apiUrlAuth}/LoginUser`, uiIdUsuario)
    }

    getFirmaBlob(cuentaId: number) {
      const headers = new HttpHeaders({
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'ngsw-bypass': 'true'
      });
      return this.http.get(`${this.apiUrl}/GetFirma/${cuentaId}`, {
        headers,
        responseType: 'blob'
      });
    }

    getEvidenciaBlob(cuentaId: number) {
      return this.http.get(`${this.apiUrl}/GetEvidencias/${cuentaId}`, {
        responseType: 'blob',
        observe: 'response'
      });
    }

    /* Mailing */
    sendMailtoClient(payload: SendMailBodyRequest){
      console.log(payload)
      return this.http.post(`${this.apiUrl}/SendMailKit`, payload)
    }
}
