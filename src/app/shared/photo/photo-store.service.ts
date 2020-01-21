import {Injectable} from '@angular/core';
import {PhotoRestService} from './photo-rest.service';
import {MediaItem, Photo, StoreItem} from './types';

@Injectable({providedIn: 'root'})
export class PhotoStoreService {
  private storeItems: StoreItem[];
  private albumsPromise;

  // TODO: Save albums and photos to persistent storage.
  constructor(private photoRestService: PhotoRestService) {
  }

  /**
   * Returns random media item.
   */
  async getMediaItem(): Promise<MediaItem> {
    await this.populateStore();

    const item = await this.getRandomItem();
    return {
      album: item.album,
      photo: this.getRandomPhoto(item),
    };
  }

  /**
   * Returns random photo and removes it from given store item.
   */
  private getRandomPhoto(item: StoreItem): Photo {
    const index = this.getRandomIndex(item.photos.length - 1);
    return item.photos.splice(index, 1)[0];
  }

  /**
   * Downloads all albums and populates store items with them.
   */
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

  /**
   * Downloads photos for given store item.
   */
  private async populatePhotosToStoreItem(storeItem: StoreItem) {
    const result = await this.photoRestService.getAlbumPhotos(storeItem.id, storeItem.nextPageToken);
    storeItem.photos = storeItem.photos.concat(...result.mediaItems.filter(item => !item.mimeType.includes('video')));
    storeItem.nextPageToken = result.nextPageToken;
  }

  private async getRandomItem(): Promise<StoreItem> {
    const storeItem = this.storeItems[this.getRandomIndex()];
    if (!storeItem.photos.length) {
      // TODO: maybe download randomly so that to show also photos from other pages.
      await this.populatePhotosToStoreItem(storeItem);
    }
    return storeItem;
  }

  private getRandomIndex(max = this.storeItems.length - 1, min = 0) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
