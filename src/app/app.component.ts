import {Component, HostListener, OnInit} from '@angular/core';
import {GapiService} from './shared/gapi/gapi.service';
import {PhotoQueueService} from './shared/photo/photo-queue.service';
import {MediaItem} from './shared/photo/types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', './spinner.scss']
})
export class AppComponent implements OnInit {
  title = 'photo-frame';
  loading = true;
  mediaItems: MediaItem[] = [];
  activeItem: MediaItem;

  isInFullscreen = false;

  constructor(private gapiService: GapiService, private photoQueueService: PhotoQueueService) {
  }

  isAuthorized = (): boolean => this.gapiService.isAuthorized;

  async ngOnInit() {
    await this.gapiService.loadClient();
    await this.photoQueueService.initQueue();

    this.mediaItems = [this.photoQueueService.getPhoto(), this.photoQueueService.getPhoto()];
    this.activeItem = this.mediaItems[0];
    this.loading = false;

    setInterval(this.nextItem, 15000);
  }

  nextItem = () => {
    this.activeItem = this.mediaItems[1];
    setTimeout(() => {
      this.mediaItems = [this.mediaItems[1], this.photoQueueService.getPhoto()];
    }, 700);
  };

  signIn() {
    this.gapiService.signIn();
  }

  @HostListener('document:fullscreenchange')
  onFullscreenchange() {
    this.isInFullscreen = !!document.fullscreenElement;
  }

  toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
}
