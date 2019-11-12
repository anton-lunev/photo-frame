export interface Album {
  coverPhotoBaseUrl: string;
  coverPhotoMediaItemId: string;
  id: string;
  mediaItemsCount: string;
  productUrl: string;
  title: string;
}

export interface PhotoMetadata {
  apertureFNumber: number;
  cameraMake: string;
  cameraModel: string;
  focalLength: number;
  isoEquivalent: number;
}

export interface GoogleMediaPhoto {
  apertureFNumber: number;
  cameraMake: string;
  cameraModel: string;
  focalLength: number;
  isoEquivalent: number;
}

export interface GoogleMediaMetadata {
  creationTime: string;
  width: string;
  height: string;
  photo: GoogleMediaPhoto;
}

export interface PhotosResponse {
  mediaItems: Photo[];
  nextPageToken: string;
}

export interface Photo {
  baseUrl: string;
  filename: string;
  id: string;
  mediaMetadata: any;
  mimeType: string;
  productUrl: string;
}

export interface StoreItem {
  id: string;
  photos: Photo[];
  album: Album;
  nextPageToken: string;
}

export interface MediaItem {
  album: Album;
  photo: Photo;
}
