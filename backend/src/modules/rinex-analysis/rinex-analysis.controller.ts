import {
  Controller, Post, Get, Delete, Param, Body, Query, UseGuards, Req, UploadedFile,
  UseInterceptors, BadRequestException, Res, Sse,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RinexAnalysisService } from './rinex-analysis.service';
import { SseService } from './rinex-sse.service';
import { AnalyzeDto } from './dto/analyze.dto';

@ApiTags('RINEX Analysis')
@ApiBearerAuth()
@Controller('rinex')
export class RinexAnalysisController {
  constructor(
    private readonly rinexService: RinexAnalysisService,
    private readonly sse: SseService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload RINEX file for analysis' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async upload(
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se proporcionó ningún archivo');
    return this.rinexService.uploadFile(user.sub, file);
  }

  @Post('session/:sessionId/select-file')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Select a specific file from ZIP archive' })
  async selectZipFile(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Body('fileName') fileName: string,
  ) {
    if (!fileName) throw new BadRequestException('fileName es requerido');
    return this.rinexService.selectZipFile(sessionId, fileName);
  }

  @Post('analyze/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Analyze uploaded RINEX file' })
  async analyze(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
    @Body() dto: AnalyzeDto,
  ) {
    const result = await this.rinexService.analyze(user.sub, sessionId, dto);
    return { success: true, data: result.analysis, summary: result.summary };
  }

  @Get('progress/:sessionId')
  @Public()
  @ApiOperation({ summary: 'SSE progress stream for analysis' })
  @Sse()
  progress(
    @Param('sessionId') sessionId: string,
  ): Observable<MessageEvent> {
    const subject = this.sse.getSubject(sessionId);
    if (!subject) {
      return new Observable(observer => {
        observer.next({ data: JSON.stringify({ step: 'done', percent: 100, message: 'Completado' }) } as MessageEvent);
        observer.complete();
      });
    }
    return subject.pipe(
      map(event => ({
        data: JSON.stringify(event),
      } as MessageEvent)),
    );
  }

  @Delete('analyze/:sessionId')
  @ApiOperation({ summary: 'Cancel ongoing analysis' })
  async cancelAnalysis(@Param('sessionId') sessionId: string) {
    this.sse.cancel(sessionId);
    return { success: true, message: 'Análisis cancelado' };
  }

  @Get('analysis/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get analysis by ID' })
  async getAnalysis(@CurrentUser() user: any, @Param('id') id: string) {
    const analysis = await this.rinexService.getAnalysis(id, user.sub);
    const analysisObj = analysis as any;
    const fmt = (m: number) => {
      if (!m || m <= 0) return '0 s';
      const totalSec = Math.round(m * 60);
      const d = Math.floor(totalSec / 86400);
      const h = Math.floor((totalSec % 86400) / 3600);
      const min = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      const parts: string[] = [];
      if (d > 0) parts.push(`${d} día(s)`);
      if (h > 0) parts.push(`${h} hora(s)`);
      if (min > 0) parts.push(`${min} minuto(s)`);
      if (s > 0 || parts.length === 0) parts.push(`${s} segundo(s)`);
      return parts.join(', ');
    };
    return {
      success: true,
      data: {
        ...analysisObj,
        durationFormatted: fmt(analysis.observedDuration),
        effectiveFormatted: fmt(analysis.effectiveDuration || analysis.observedDuration),
      },
    };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user RINEX analysis history' })
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.rinexService.getHistory(user.sub, page || 1, limit || 20);
    return {
      success: true,
      data: result.data,
      meta: { total: result.total, page: result.page, limit: result.limit, totalPages: result.totalPages },
    };
  }

  @Get('pdf/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download analysis PDF' })
  async getPdf(@CurrentUser() user: any, @Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.rinexService.generatePdfReport(id, user.sub);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rinex-report-${id.substring(0, 8)}.pdf"`);
    res.send(pdfBuffer);
  }

  @Delete('temp/:sessionId')
  @ApiOperation({ summary: 'Delete temporary session' })
  async deleteTemp(@Param('sessionId') sessionId: string) {
    await this.rinexService.deleteTempSession(sessionId);
    return { success: true, message: 'Sesión temporal eliminada' };
  }

  @Delete('history/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete analysis record' })
  async deleteAnalysis(@CurrentUser() user: any, @Param('id') id: string) {
    await this.rinexService.deleteAnalysis(id, user.sub);
    return { success: true, message: 'Análisis eliminado del historial' };
  }
}
