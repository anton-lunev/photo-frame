import {Injectable, NgZone} from '@angular/core';

const API_KEY = 'AIzaSyAIQK28Qiunrin-aETeDiBMfhCmgVEoWa4';
const CLIENT_ID = '672049703287-p1jo1sa0j9ui3lhip685c1kik8v7oc0d';
const SCOPE = 'https://www.googleapis.com/auth/photoslibrary.readonly';

@Injectable({
  providedIn: 'root'
})
export class GapiService {
  googleAuth: gapi.auth2.GoogleAuth;
  user: gapi.auth2.GoogleUser;
  isAuthorized = false;

  constructor(private zone: NgZone) {
  }

  loadClient() {
    return new Promise((resolve, reject) => {
      this.zone.run(() => {
        gapi.load('client', {
          callback: resolve,
          onerror: reject,
          timeout: 1000, // 5 seconds.
          ontimeout: reject
        });
      });
    }).then(() => this.initClient());
  }

  private initClient() {
    // 2. Initialize the JavaScript client library.
    return gapi.client.init({
      apiKey: API_KEY,
      clientId: `${CLIENT_ID}.apps.googleusercontent.com`,
      scope: SCOPE,
    })
      .then(() => {
        this.googleAuth = gapi.auth2.getAuthInstance();
        this.googleAuth.isSignedIn.listen(this.updateSigninStatus);
        this.updateSigninStatus(this.googleAuth.isSignedIn.get());
      });
  }

  private updateSigninStatus = (signedIn: boolean) => {
    if (signedIn) {
      this.user = this.googleAuth.currentUser.get();
      this.isAuthorized = this.user.hasGrantedScopes(SCOPE);
    } else {
      this.isAuthorized = false;
    }
  };

  signIn() {
    this.googleAuth.signIn();
  }

  signOut() {
    this.googleAuth.signOut();
  }
}
