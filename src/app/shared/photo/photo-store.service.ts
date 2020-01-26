import {Injectable} from '@angular/core';
import {PhotoRestService} from './photo-rest.service';
import {PhotoStorageService} from './photo-storage.service';
import {Album, MediaItem, Photo, StoreItem} from './types';

@Injectable({providedIn: 'root'})
export class PhotoStoreService {
  private storeItems: StoreItem[] = [];
  private albumsPromise;

  constructor(private photoRestService: PhotoRestService, private storageService: PhotoStorageService) {
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

    let albums = this.storageService.getAlbums();
    if (albums) {
      // Continue immediately but update store with new albums later.
      this.albumsPromise = Promise.resolve();
      this.photoRestService.getAlbums().then(_albums => this.updateStoreWithAlbums(_albums));
    } else {
      // Wait for albums fetching.
      this.albumsPromise = this.photoRestService.getAlbums();
      albums = await this.albumsPromise;
    }
    this.updateStoreWithAlbums(albums);
  }

  private updateStoreWithAlbums(albums: Album[]) {
    if (albums.length === this.storeItems.length) {
      return;
    }
    this.storageService.set(this.storageService.albumsKey, albums);

    const ids = this.storeItems.reduce((set, item) => set.add(item.id), new Set());
    const newStoreItems = albums.filter(album => !ids.has(album.id)).map(album => ({
      id: album.id,
      album,
      photos: [],
      nextPageToken: null
    }));
    this.storeItems = this.storeItems.concat(newStoreItems);
  }

  /** Downloads photos for given {storeItem}. */
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
