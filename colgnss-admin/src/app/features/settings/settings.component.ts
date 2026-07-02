import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SettingsService } from '@core/services/settings.service';
import { SystemConfig } from '@core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTabsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule,
    MatDividerModule, MatSnackBarModule, MatTooltipModule,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  configs = signal<SystemConfig[]>([]);
  searchQuery = signal('');
  activeTab = signal(0);

  tabs = [
    { label: 'General', key: 'general' },
    { label: 'JWT', key: 'jwt' },
    { label: 'Publicidad', key: 'advertising' },
    { label: 'Correo', key: 'mail' },
    { label: 'SMTP', key: 'smtp' },
    { label: 'API', key: 'api' },
    { label: 'Límites', key: 'limits' },
    { label: 'Sesión', key: 'session' },
  ];

  filteredConfigs = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const tabKey = this.tabs[this.activeTab()]?.key;
    let list = this.configs().filter((c) => c.group === tabKey);
    if (q) list = list.filter((c) => c.key.toLowerCase().includes(q) || c.label.toLowerCase().includes(q));
    return list;
  });

  editedValues = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.settingsService.getAllConfig().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.configs.set(list);
        const edits: Record<string, string> = {};
        list.forEach((c) => { edits[c.key] = String(c.value ?? ''); });
        this.editedValues.set(edits);
      },
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 400);
  }

  onToggleChange(config: any, event: any) {
    this.editedValues()[config.key] = String(event.checked);
    this.saveConfig(config);
  }

  saveConfig(config: SystemConfig): void {
    const newValue = this.editedValues()[config.key];
    this.settingsService.updateConfig(config.key, newValue).subscribe({
      next: () => {
        this.snackBar.open(`Configuración "${config.label}" actualizada`, 'OK', { duration: 3000 });
        this.loadData();
      },
      error: () => {
        this.snackBar.open(`Error al actualizar "${config.label}"`, 'Cerrar', { duration: 5000, panelClass: 'error-snack' });
      },
    });
  }

  trackByKey(_: number, item: SystemConfig): string {
    return item.key;
  }

  getFieldType(config: SystemConfig): string {
    if (config.type === 'boolean') return 'boolean';
    if (config.type === 'number' || config.type === 'integer') return 'number';
    if (config.type === 'password' || config.key.toLowerCase().includes('secret') || config.key.toLowerCase().includes('password')) return 'password';
    return 'text';
  }
}
