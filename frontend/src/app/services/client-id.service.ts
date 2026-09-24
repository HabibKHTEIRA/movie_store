import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ClientIdService {
  private readonly STORAGE_KEY = 'cinestore_client_uuid';

  getClientId(): string {
    let id = localStorage.getItem(this.STORAGE_KEY);
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem(this.STORAGE_KEY, id);
    }
    return id;
  }
}
