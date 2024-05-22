import { Component, HostListener, OnDestroy } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Room } from 'livekit-client';
import { VideoComponent } from './video/video.component';
import { AudioComponent } from './audio/audio.component';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

// For local development, leave these variables empty
// For production, configure them with correct URLs depending on your deployment
var APPLICATION_SERVER_URL = '';
var LIVEKIT_URL = '';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [ReactiveFormsModule, AudioComponent, VideoComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
    roomForm = new FormGroup({
        roomName: new FormControl('Test Room', Validators.required),
        participantName: new FormControl('Participant' + Math.floor(Math.random() * 100), Validators.required),
    });

    room?: Room;

    constructor(private httpClient: HttpClient) {
        this.configureUrls();
    }

    configureUrls() {
        // If APPLICATION_SERVER_URL is not configured, use default value from local development
        if (!APPLICATION_SERVER_URL) {
            if (window.location.hostname === 'localhost') {
                APPLICATION_SERVER_URL = 'http://localhost:6080/';
            } else {
                APPLICATION_SERVER_URL = 'https://' + window.location.hostname + ':6443/';
            }
        }

        // If LIVEKIT_URL is not configured, use default value from local development
        if (!LIVEKIT_URL) {
            if (window.location.hostname === 'localhost') {
                LIVEKIT_URL = 'ws://localhost:7880/';
            } else {
                LIVEKIT_URL = 'wss://' + window.location.hostname + ':7443/';
            }
        }
    }

    async joinRoom() {
        // Initialize a new Room object
        this.room = new Room();

        try {
            // Get the room name and participant name from the form
            const roomName = this.roomForm.value.roomName!;
            const participantName = this.roomForm.value.participantName!;

            // Get a token from your application server with the room name and participant name
            const token = await this.getToken(roomName, participantName);

            // Connect to the room with the LiveKit URL and the token
            await this.room.connect(LIVEKIT_URL, token);

            // Publish your camera and microphone
            await this.room.localParticipant.enableCameraAndMicrophone();
        } catch (error: any) {
            console.log('There was an error connecting to the room:', error?.message);
        }
    }

    async leaveRoom() {
        // Leave the room by calling 'disconnect' method over the Room object
        await this.room?.disconnect();
        delete this.room;
    }

    @HostListener('window:beforeunload')
    async ngOnDestroy() {
        // On window closed or component destroyed, leave the room
        await this.leaveRoom();
    }

    /**
     * --------------------------------------------
     * GETTING A TOKEN FROM YOUR APPLICATION SERVER
     * --------------------------------------------
     * The method below request the creation of a token to
     * your application server. This prevents the need to expose
     * your LiveKit API key and secret to the client side.
     *
     * In this sample code, there is no user control at all. Anybody could
     * access your application server endpoints. In a real production
     * environment, your application server must identify the user to allow
     * access to the endpoints.
     */
    async getToken(roomName: string, participantName: string): Promise<string> {
        return lastValueFrom(
            this.httpClient.post<string>(APPLICATION_SERVER_URL + 'token', { roomName, participantName })
        );
    }
}
