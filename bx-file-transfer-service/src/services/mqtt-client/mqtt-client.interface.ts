import { Observable } from 'rxjs';

export interface IMqttClientService {
  emit<Message>(channel: string, message: Message): Observable<string>;
}
