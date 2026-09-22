import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts().length > 0">
      <div
        *ngFor="let toast of toastService.toasts()"
        class="toast-item"
        [ngClass]="toast.type"
      >
        <div class="toast-icon">
          <span *ngIf="toast.type === 'warning'">⚠️</span>
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'info'">ℹ️</span>
        </div>
        <div class="toast-content">
          <div class="toast-title" *ngIf="toast.title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="toastService.remove(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 99999;
      max-width: 400px;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(16px);
      border-radius: 12px;
      padding: 14px 18px;
      color: #f8fafc;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .toast-item.warning { border-color: #f59e0b; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.2); }
    .toast-item.success { border-color: #10b981; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2); }
    .toast-item.error { border-color: #ef4444; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2); }
    .toast-item.info { border-color: #8b5cf6; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2); }
    .toast-icon { font-size: 1.1rem; line-height: 1; }
    .toast-content { flex: 1; }
    .toast-title { font-weight: 700; font-size: 0.85rem; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
    .toast-msg { font-size: 0.9rem; line-height: 1.35; color: #cbd5e1; }
    .toast-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
      line-height: 1;
      padding: 0 4px;
    }
    .toast-close:hover { color: #fff; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
