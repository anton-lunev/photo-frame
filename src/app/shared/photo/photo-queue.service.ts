import {Injectable} from '@angular/core';
import {PhotoStoreService} from './photo-store.service';
import {MediaItem} from './types';

@Injectable({providedIn: 'root'})
export class PhotoQueueService {
  queueSize = 2;
  items: MediaItem[];

  constructor(private photoStoreService: PhotoStoreService) {
  }

  async initQueue() {
    const requests = Array.from({length: this.queueSize}, () => this.photoStoreService.getMediaItem());
    this.items = await Promise.all(requests);
  }

  getPhoto(): MediaItem {
    // TODO: this method might be async since it's possible to get all the element before it loads new one.
    this.addPhoto();
    if (!this.isEmpty()) {
      return this.items.shift();
    }
  }

  async addPhoto() {
    const photo = await this.photoStoreService.getMediaItem();
    this.items.push(photo);
  }

  private isEmpty(): boolean {
    return !this.items.length;
  }
}
