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

  /** Returns random media item. */
  async getMediaItem(): Promise<MediaItem> {
    await this.populateStore();

    const item = await this.getRandomItem();
    const photo = await this.getRandomPhoto(item);
    return {album: item.album, photo};
  }

  /** Returns random photo and removes it from given store item. */
  private async getRandomPhoto(item: StoreItem): Promise<Photo> {
    if (!item.photos.length) {
      this.populatePhotosToStoreItem(item);
    }
    const index = this.getRandomIndex(item.photos.length - 1);
    const id = item.photos.splice(index, 1)[0];
    try {
      const photos = await this.photoRestService.getPhotos([id, item.album.coverPhotoMediaItemId]);
      // Update album cover since it could already expire.
      item.album.coverPhotoBaseUrl = photos.mediaItemResults[1].mediaItem.baseUrl;
      return photos.mediaItemResults[0].mediaItem;
    } catch {
      return this.getRandomPhoto(item);
    }
  }

  /** Downloads all albums and populates store items with them. */
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

    const itemsMap = this.storeItems.reduce((map, item) => map.set(item.id, item), new Map());
    albums.forEach(album => {
      if (!itemsMap.has(album.id)) {
        this.storeItems.push({id: album.id, album, photos: [], nextPageToken: null});
      } else {
        itemsMap.get(album.id).album = album;
      }
    });
  }

  /** Downloads photos for given {storeItem}. */
  private async populatePhotosToStoreItem(storeItem: StoreItem) {
    const photos = this.storageService.getAlbumPhotos(storeItem.id);
    if (photos) {
      storeItem.photos = photos;
      return;
    }

    // If photos are not in local storage wait for first page loading, and load the rest in background.
    await this.loadAlbumPage(storeItem);
    this.loadAllAlbumPhotos(storeItem);
  }

  private async loadAllAlbumPhotos(storeItem: StoreItem) {
    while (storeItem.nextPageToken) {
      await this.loadAlbumPage(storeItem);
    }
  }

  private async loadAlbumPage(storeItem: StoreItem) {
    const result = await this.photoRestService.getAlbumPhotos(storeItem.id, storeItem.nextPageToken);
    storeItem.photos = storeItem.photos.concat(...result.mediaItems.filter(item => !item.mimeType.includes('video')).map(item => item.id));
    storeItem.nextPageToken = storeItem.nextPageToken === result.nextPageToken ? undefined : result.nextPageToken;
    this.storageService.set(storeItem.id, storeItem.photos);
  }

  private async getRandomItem(): Promise<StoreItem> {
    const storeItem = this.storeItems[this.getRandomIndex()];
    if (!storeItem.photos.length) {
      await this.populatePhotosToStoreItem(storeItem);
    }
    return storeItem;
  }

  private getRandomIndex(max = this.storeItems.length - 1, min = 0) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
