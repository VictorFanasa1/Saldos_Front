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
import { CrearUsuarioDto, Usuario } from '../shared/Usuarios.model';
import { CrearUbicacionDto, Ubicacion } from '../shared/ubicaciones.model';
import { RolesModel } from '../shared/roles.mnodel';
import { Role } from './auth.service';

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

    consultaporidecuentaconincidenciaAll(ubicacion: string){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetCuentaConPreguntasBySumFlagAll/${1}/${ubicacion}`);
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
    
    consultaporidecuentasinincidenciaAll(ubicacion: string){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetCuentaConPreguntasBySumFlagAll/${0}/${ubicacion}`);
    }

     consultaporidecuentasinincidenciaAllD(ubicacion: string){
      return this.http.get<IncidenciasRequest[]>(`${this.apiUrl}/GetCuentaConPreguntasBySumFlagAll/${0}/${ubicacion}`);
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

    getRolUser(unombreUsuario: getRolUserRequest): Observable<UserRolResponse>{

      return this.http.post<UserRolResponse>(`${this.apiUrlAuth}/LoginUser`, unombreUsuario)
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


    /* Administracion de Usuarios y roles */

    // GET: lista de usuarios
      getUsuarios(): Observable<Usuario[]> {
        return this.http.get<Usuario[]>(`${this.apiUrl}/GetUsuarios`);
      }

      // GET: un usuario por id
      getUsuario(id: number): Observable<Usuario> {
        return this.http.get<Usuario>(`${this.apiUrl}/${id}`);
      }

      // POST: crear usuario
      createUsuario(usuario: CrearUsuarioDto): Observable<Usuario> {
        console.log(usuario)
        return this.http.post<Usuario>(`${this.apiUrl}/CreateUsuario`, usuario);
      }

      // PUT: actualizar usuario
      updateUsuario(id: number, usuario: CrearUsuarioDto): Observable<void> {
        console.log(usuario)
        return this.http.put<void>(`${this.apiUrl}/UpdateUsuario/${id}`, usuario);
      }

      // DELETE: eliminar usuario
      deleteUsuario(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
      }


      /* Catalogos */

      // GET: lista de ubicaciones (solo activas según el controller)
      getUbicaciones(): Observable<Ubicacion[]> {
        return this.http.get<Ubicacion[]>(`${this.apiUrl}/GetUbicaciones`);
      }

      // GET: una ubicación por Id
      getUbicacion(id: number): Observable<Ubicacion> {
        return this.http.get<Ubicacion>(`${this.apiUrl}/${id}`);
      }

      // POST: crear una nueva ubicación
      createUbicacion(dto: CrearUbicacionDto): Observable<Ubicacion> {
        return this.http.post<Ubicacion>(this.apiUrl, dto);
      }

      // PUT: actualizar una ubicación (nombre y activo)
      updateUbicacion(id: number, ubicacion: Ubicacion): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, ubicacion);
      }

      // OPCIONAL: desactivar (Actvio = 0) usando el endpoint /desactivar
      desactivarUbicacion(id: number): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/desactivar`, {});
      }

      getRoles(): Observable<RolesModel[]>{
        return this.http.get<RolesModel[]>(`${this.apiUrl}/GetRoles`)
      }

}
