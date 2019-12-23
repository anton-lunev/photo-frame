import {Injectable} from '@angular/core';
import {Album, PhotosResponse} from './types';

@Injectable({
  providedIn: 'root'
})
export class PhotoRestService {
  private baseUrl = 'https://photoslibrary.googleapis.com/v1';

  getAlbums(pageToken?: string): Promise<Album[]> {
    return gapi.client.request({
      path: `${this.baseUrl}/albums`,
      params: {pageSize: 50, pageToken: pageToken || null},
      method: 'GET',
    }).then(async (response) => {
      console.log(response);
      const res: Album[] = response.result.albums;
      if (response.result.nextPageToken) {
        res.concat(await this.getAlbums(response.result.nextPageToken));
      }
      return res;
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
