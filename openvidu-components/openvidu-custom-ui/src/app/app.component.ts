import { HttpClient } from "@angular/common/http";
import { Component } from "@angular/core";
import { lastValueFrom } from "rxjs";

import { environment } from 'src/environments/environment';
import { OpenViduAngularModule, ApiDirectiveModule } from "openvidu-angular";

@Component({
    selector: 'app-root',
    template: '<ov-videoconference [token]="token" (onTokenRequested)="onTokenRequested($event)"></ov-videoconference>',
    styles: [''],
    standalone: true,
    imports: [OpenViduAngularModule, ApiDirectiveModule]
})
export class AppComponent {

  // The URL of the application server.
  APPLICATION_SERVER_URL = environment.applicationServerUrl;

  // The name of the room to join.
  roomName = 'openvidu-custom-ui';

  // The token used to join the room.
  token!: string;

  // Creates a new instance of the AppComponent class.
  constructor(private httpClient: HttpClient) { }

  // Requests a token to join the room with the given participant name.
  async onTokenRequested(participantName: string) {
    const { token } = await this.getToken(this.roomName, participantName);
    this.token = token;
  }

  // Retrieves a token to join the room with the given name and participant name.
  getToken(roomName: string, participantName: string): Promise<any> {
    try {
      return lastValueFrom(this.httpClient.post<any>(this.APPLICATION_SERVER_URL + 'api/sessions', { roomName, participantName }));
    } catch (error: any) {
      if (error.status === 404) {
        throw { status: error.status, message: 'Cannot connect with backend. ' + error.url + ' not found' };
      }
      throw error;
    }
  }
}