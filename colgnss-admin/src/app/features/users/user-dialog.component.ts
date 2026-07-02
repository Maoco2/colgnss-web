import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '@core/models';
import { UsersService } from '@core/services/users.service';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatDividerModule,
    MatCheckboxModule, MatSnackBarModule, FormsModule,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss'],
})
export class UserDialogComponent {
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);
  private dialogData = inject<{ user?: User }>(MAT_DIALOG_DATA, { optional: true });
  private usersService = inject(UsersService);
  private snackBar = inject(MatSnackBar);

  isEditing = signal(!!this.dialogData?.user);
  saving = signal(false);

  form = signal<Partial<User>>({
    fullName: this.dialogData?.user?.fullName || '',
    surname: this.dialogData?.user?.surname || '',
    email: this.dialogData?.user?.email || '',
    phone: this.dialogData?.user?.phone || '',
    profession: this.dialogData?.user?.profession || '',
    gender: this.dialogData?.user?.gender || '',
    role: this.dialogData?.user?.role || 'user',
    company: this.dialogData?.user?.company || '',
    university: this.dialogData?.user?.university || '',
    countryId: this.dialogData?.user?.countryId || '',
    departmentId: this.dialogData?.user?.departmentId || '',
    cityId: this.dialogData?.user?.cityId || '',
    isActive: this.dialogData?.user?.isActive ?? true,
    isVerified: this.dialogData?.user?.isVerified ?? true,
  });

  roles = [
    { value: 'admin', label: 'Administrador' },
    { value: 'premium', label: 'Premium' },
    { value: 'moderator', label: 'Moderador' },
    { value: 'user', label: 'Usuario' },
    { value: 'viewer', label: 'Visor' },
  ];

  countries = [
    { value: 'CO', label: 'Colombia' },
    { value: 'MX', label: 'México' },
    { value: 'AR', label: 'Argentina' },
    { value: 'ES', label: 'España' },
    { value: 'US', label: 'Estados Unidos' },
    { value: 'BR', label: 'Brasil' },
    { value: 'CL', label: 'Chile' },
    { value: 'PE', label: 'Perú' },
    { value: 'EC', label: 'Ecuador' },
    { value: 'VE', label: 'Venezuela' },
  ];

  updateField<K extends keyof User>(field: K, value: User[K]): void {
    this.form.update(f => ({ ...f, [field]: value }));
  }

  save(formRef: NgForm): void {
    if (formRef.invalid) return;
    this.saving.set(true);
    const data = { ...this.form() };
    const id = this.dialogData?.user?.id;
    const request = id
      ? this.usersService.updateUser(id, data)
      : this.usersService.createUser(data);
    request.subscribe({
      next: (result) => {
        this.snackBar.open(id ? 'Usuario actualizado' : 'Usuario creado', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(result);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Error al guardar usuario', 'Cerrar', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
