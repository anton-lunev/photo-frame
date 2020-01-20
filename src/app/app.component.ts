import {Component, HostListener, OnInit} from '@angular/core';
import {GapiService} from './shared/gapi/gapi.service';
import {PhotoQueueService} from './shared/photo/photo-queue.service';
import {MediaItem} from './shared/photo/types';

enum RatioType {
  default,
  contain,
  panorama
}

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
  ratioTypes = new Map<MediaItem, RatioType>();
  windowRatio: number;

  isInFullscreen = false;

  constructor(private gapiService: GapiService, private photoQueueService: PhotoQueueService) {
  }

  isAuthorized = (): boolean => this.gapiService.isAuthorized;

  async ngOnInit() {
    await this.gapiService.loadClient();
    if (!this.isAuthorized()) {
      this.loading = false;
      return;
    }
    this.initPhotoQueue();
  }

  private async initPhotoQueue() {
    await this.photoQueueService.initQueue();

    this.mediaItems = [this.photoQueueService.getPhoto(), this.photoQueueService.getPhoto()];
    this.activeItem = this.mediaItems[0];
    this.updateRatioTypes();
    this.loading = false;

    // TODO: check aspect ratio of photos and render it accordingly(animation for panorama, blurred background for vertical photos).
    setInterval(this.nextItem, 20000);
  }

  nextItem = () => {
    this.activeItem = this.mediaItems[1];
    setTimeout(() => {
      this.ratioTypes.delete(this.mediaItems[0]);
      const newMediaItem = this.photoQueueService.getPhoto();
      this.mediaItems = [this.mediaItems[1], newMediaItem];
      this.ratioTypes.set(newMediaItem, this.getRatioType(newMediaItem));
    }, 700);
  }

  getRatioType(mediaItem: MediaItem) {
    const {width, height} = mediaItem.photo.mediaMetadata;
    const photoRatio = +width / +height;

    if (Math.abs(this.windowRatio - photoRatio) > 0.25) {
      return RatioType.contain;
    }
    return RatioType.default;
  }

  isContain(mediaItem: MediaItem): boolean {
    return this.ratioTypes.get(mediaItem) === RatioType.contain;
  }

  async signIn() {
    this.loading = true;
    await this.gapiService.signIn();
    this.initPhotoQueue();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateRatioTypes();
  }

  updateRatioTypes() {
    const {innerHeight, innerWidth} = window;
    this.windowRatio = innerWidth / innerHeight;
    this.mediaItems.forEach(item => this.ratioTypes.set(item, this.getRatioType(item)));
  }

  @HostListener('document:fullscreenchange')
  onFullscreenchange() {
    this.isInFullscreen = !!document.fullscreenElement;
  }

  toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}
