import {Injectable} from '@angular/core';
import {Album, PhotosResponse} from './types';

@Injectable({
  providedIn: 'root'
})
export class PhotoRestService {
  private baseUrl = 'https://photoslibrary.googleapis.com/v1';

  getAlbums(): Promise<Album[]> {
    return gapi.client.request({
      path: `${this.baseUrl}/albums`,
      params: {pageSize: 50},
      method: 'GET',
    }).then((response) => {
      console.log(response);
      // TODO: request all the pages.
      return response.result.albums as Album[];
    });
  }

  getAlbumPhotos(albumId: string, pageToken?: string): Promise<PhotosResponse> {
    return gapi.client.request({
      path: `${this.baseUrl}/mediaItems:search`,
      method: 'POST',
      body: {
        albumId,
        pageSize: 100,
      }
    }).then((response) => {
      console.log(response);
      return response.result;
    });
  }
}
