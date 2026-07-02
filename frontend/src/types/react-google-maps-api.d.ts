declare module 'firebase/storage' {
  export function getStorage(app?: any): any;
  export class FirebaseStorage { }
  export function ref(storage: any, url?: string): any;
  export function uploadBytes(ref: any, data: any): Promise<any>;
  export function getDownloadURL(ref: any): Promise<string>;
}

declare module '@react-google-maps/api' {
  import { ComponentType, ReactNode } from 'react';

  export const GoogleMap: ComponentType<any>;
  export const Marker: ComponentType<any>;
  export const InfoWindow: ComponentType<any>;
  export const Circle: ComponentType<any>;
  export const Polyline: ComponentType<any>;
  export function useJsApiLoader(opts: any): { isLoaded: boolean; loadError: any };
}
