import {Injectable} from '@angular/core';
import {PhotoRestService} from './photo-rest.service';
import {MediaItem, StoreItem} from './types';

@Injectable({
  providedIn: 'root'
})
export class PhotoStoreService {
  private storeItems: StoreItem[];
  private albumsPromise;

  constructor(private photoRestService: PhotoRestService) {
  }

  private async populateStore() {
    if (this.albumsPromise) {
      return this.albumsPromise;
    }
    this.albumsPromise = this.photoRestService.getAlbums();
    const albums = await this.albumsPromise;

    this.storeItems = albums.map(album => ({
      id: album.id,
      album,
      photos: [],
      nextPageToken: null
    }));
  }

  private async populatePhotosToStoreItem(mediaItem: StoreItem) {
    const result = await this.photoRestService.getAlbumPhotos(mediaItem.id, mediaItem.nextPageToken);
    mediaItem.photos = mediaItem.photos.concat(...result.mediaItems.filter(item => !item.mimeType.includes('video')));
    mediaItem.nextPageToken = result.nextPageToken;
  }

  private async getRandomItem(): Promise<StoreItem> {
    const storeItem = this.storeItems[this.getRandomIndex()];
    if (!storeItem.photos.length) {
      await this.populatePhotosToStoreItem(storeItem);
    }
    return storeItem;
  }

  private getRandomPhoto(item: StoreItem) {
    return item.photos[this.getRandomIndex(item.photos.length - 1)];
  }

  async getMediaItem(): Promise<MediaItem> {
    await this.populateStore();

    const item = await this.getRandomItem();
    return {
      album: item.album,
      photo: this.getRandomPhoto(item),
    };
  }

  getRandomIndex(max = this.storeItems.length - 1, min = 0) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
