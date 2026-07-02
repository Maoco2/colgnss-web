import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { User, UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { ProcessingHistory } from '../entities/processing-history.entity';
import { ActivityLog } from '../entities/activity-log.entity';

@ApiTags('Enterprise - Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/reports')
export class ReportsController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ProcessingHistory)
    private processingRepository: Repository<ProcessingHistory>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Export users report' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'excel', 'pdf'] })
  async getUsersReport(@Query('format') format: string, @Res() res: Response): Promise<any> {
    const users = await this.userRepository.find({ order: { createdAt: 'DESC' } });
    if (format === 'csv') {
      const header = 'ID,Email,Nombre Completo,Teléfono,Profesión,Sexo,Rol,Activo,Creado\n';
      const rows = users.map(u =>
        `${u.id},${u.email},"${u.fullName || ''}",${u.phone || ''},${u.profession || ''},${u.gender || ''},${u.role},${u.isActive},${u.createdAt}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=users-report.csv');
      return res.send('\uFEFF' + header + rows);
    }
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Usuarios');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Nombre Completo', key: 'fullName', width: 25 },
        { header: 'Teléfono', key: 'phone', width: 15 },
        { header: 'Profesión', key: 'profession', width: 20 },
        { header: 'Sexo', key: 'gender', width: 10 },
        { header: 'Rol', key: 'role', width: 10 },
        { header: 'Activo', key: 'isActive', width: 10 },
        { header: 'Creado', key: 'createdAt', width: 25 },
      ];
      users.forEach(u => sheet.addRow({
        id: u.id, email: u.email, fullName: u.fullName || '', phone: u.phone || '',
        profession: u.profession || '', gender: u.gender || '', role: u.role,
        isActive: u.isActive ? 'Sí' : 'No', createdAt: u.createdAt,
      }));
      sheet.getRow(1).font = { bold: true };
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=users-report.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    }
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=users-report.pdf');
      doc.pipe(res);
      doc.fontSize(16).text('Reporte de Usuarios', { align: 'center' });
      doc.moveDown();
      const headers = ['Email', 'Nombre', 'Teléfono', 'Profesión', 'Sexo', 'Rol'];
      const rows = users.map(u => [u.email, u.fullName || '', u.phone || '', u.profession || '', u.gender || '', u.role]);
      const colWidths = [120, 80, 60, 70, 40, 40];
      let y = doc.y;
      doc.fontSize(8).font('Helvetica-Bold');
      let x = 30;
      headers.forEach((h, i) => { doc.text(h, x, y, { width: colWidths[i] }); x += colWidths[i]; });
      doc.moveDown(0.5);
      doc.font('Helvetica');
      rows.forEach(row => {
        y = doc.y;
        if (y > 550) { doc.addPage(); y = doc.y; }
        x = 30;
        row.forEach((cell, i) => { doc.text(String(cell || ''), x, y, { width: colWidths[i] }); x += colWidths[i]; });
        doc.moveDown(0.4);
      });
      doc.end();
      return;
    }
    return ApiResponse.ok(users);
  }

  @Get('processings')
  @ApiOperation({ summary: 'Export processing report' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'excel', 'pdf'] })
  async getProcessingsReport(@Query('format') format: string, @Res() res: Response): Promise<any> {
    const data = await this.processingRepository.find({ order: { createdAt: 'DESC' }, relations: ['user', 'station'] });
    if (format === 'csv') {
      const header = 'ID,Usuario,Archivo,Tipo,Estado,Duración,Creado\n';
      const rows = data.map(p =>
        `${p.id},${p.user?.email || 'N/A'},${p.fileName},${p.fileType},${p.status},${p.duration},${p.createdAt}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=processings-report.csv');
      return res.send('\uFEFF' + header + rows);
    }
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Procesamientos');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Usuario', key: 'user', width: 25 },
        { header: 'Archivo', key: 'fileName', width: 25 },
        { header: 'Tipo', key: 'fileType', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Duración (s)', key: 'duration', width: 12 },
        { header: 'Creado', key: 'createdAt', width: 25 },
      ];
      data.forEach(p => sheet.addRow({
        id: p.id, user: p.user?.email || 'N/A', fileName: p.fileName,
        fileType: p.fileType, status: p.status, duration: p.duration, createdAt: p.createdAt,
      }));
      sheet.getRow(1).font = { bold: true };
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=processings-report.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    }
    return ApiResponse.ok(data);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Export audit report' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'excel', 'pdf'] })
  async getAuditReport(@Query('format') format: string, @Res() res: Response): Promise<any> {
    const data = await this.activityLogRepository.find({ order: { createdAt: 'DESC' }, relations: ['user'] });
    if (format === 'csv') {
      const header = 'ID,Usuario,Acción,Entidad,ID Entidad,IP,Creado\n';
      const rows = data.map(a =>
        `${a.id},${a.user?.email || 'N/A'},${a.action},${a.entity},${a.entityId || ''},${a.ip || ''},${a.createdAt}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-report.csv');
      return res.send('\uFEFF' + header + rows);
    }
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Auditoría');
      sheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Usuario', key: 'user', width: 25 },
        { header: 'Acción', key: 'action', width: 20 },
        { header: 'Entidad', key: 'entity', width: 20 },
        { header: 'ID Entidad', key: 'entityId', width: 36 },
        { header: 'IP', key: 'ip', width: 15 },
        { header: 'Creado', key: 'createdAt', width: 25 },
      ];
      data.forEach(a => sheet.addRow({
        id: a.id, user: a.user?.email || 'N/A', action: a.action, entity: a.entity,
        entityId: a.entityId || '', ip: a.ip || '', createdAt: a.createdAt,
      }));
      sheet.getRow(1).font = { bold: true };
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-report.xlsx');
      await workbook.xlsx.write(res);
      return res.end();
    }
    return ApiResponse.ok(data);
  }
}

