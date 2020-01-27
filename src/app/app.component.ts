import {Component, HostListener, OnInit} from '@angular/core';
import {GapiService} from './shared/gapi/gapi.service';
import {PhotoQueueService} from './shared/photo/photo-queue.service';
import {MediaItem} from './shared/photo/types';
import {Deferred} from './shared/utils/deferred';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss', './spinner.scss']
})
export class AppComponent implements OnInit {
  static interval = 20000;

  loading = true;
  items: DataItem[] = [];
  activeItem: DataItem;
  nextItemLoadStatus = new Deferred();
  onlineStatus = new Deferred();
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
    this.onlineStatus.resolve();
    this.initPhotoQueue();
  }

  private async initPhotoQueue() {
    await this.photoQueueService.initQueue();

    this.items = [this.getNewPhoto(), this.getNewPhoto()];
    this.activeItem = this.items[0];
    this.loading = false;

    // TODO: check aspect ratio of photos and render it accordingly(animation for panorama, blurred background for vertical photos).
    setTimeout(() => this.nextItem(), AppComponent.interval);
  }

  onImageLoad(item: DataItem) {
    if (this.activeItem !== item) {
      this.nextItemLoadStatus.resolve();
    }
  }

  async onImageError(item: DataItem) {
    await this.onlineStatus.promise;
    if (this.activeItem === item) {
      this.nextItem();
    } else {
      this.items = [this.items[0], this.getNewPhoto()];
    }
  }

  isContainType = (item: DataItem): boolean => item.ratioType === RatioType.contain;

  toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  private async nextItem() {
    await this.onlineStatus.promise;
    await this.nextItemLoadStatus.promise;
    this.activeItem = this.items[1];
    setTimeout(() => {
      this.items = [this.items[1], this.getNewPhoto()];
      this.nextItemLoadStatus = new Deferred();
      setTimeout(() => this.nextItem(), AppComponent.interval);
    }, 900);
  }

  private getNewPhoto(): DataItem {
    return this.dataItem(this.photoQueueService.getPhoto());
  }

  private dataItem = (mediaItem: MediaItem): DataItem => ({
    mediaItem,
    photoUrl: this.photoUrl(mediaItem),
    ratioType: this.getRatioType(mediaItem)
  });

  private photoUrl(mediaItem: MediaItem): string {
    if (!mediaItem) {
      return;
    }
    const {photo} = mediaItem;
    return `${photo.baseUrl}=w${photo.mediaMetadata.width}-h${photo.mediaMetadata.height}`;
  }

  async signIn() {
    this.loading = true;
    await this.gapiService.signIn();
    this.initPhotoQueue();
  }

  private get windowRatio() {
    return window.innerWidth / window.innerHeight;
  }

  private getRatioType(mediaItem: MediaItem) {
    if (!mediaItem) {
      return RatioType.default;
    }
    const {width, height} = mediaItem.photo.mediaMetadata;
    const photoRatio = +width / +height;

    if (Math.abs(this.windowRatio - photoRatio) > 0.25) {
      return RatioType.contain;
    }
    return RatioType.default;
  }

  private updateRatioTypes() {
    this.items.forEach(item => item.ratioType = this.getRatioType(item.mediaItem));
  }

  @HostListener('window:resize')
  private onResize() {
    this.updateRatioTypes();
  }

  @HostListener('document:fullscreenchange')
  private onFullscreenchange() {
    this.isInFullscreen = !!document.fullscreenElement;
  }

  @HostListener('window:offline')
  private onOffline() {
    this.onlineStatus = new Deferred();
  }

  @HostListener('window:online')
  private onOnline() {
    this.onlineStatus.resolve();
  }
}

enum RatioType {
  default,
  contain,
  panorama
}

interface DataItem {
  mediaItem: MediaItem;
  photoUrl: string;
  ratioType: RatioType;
  loaded?: boolean;
}
