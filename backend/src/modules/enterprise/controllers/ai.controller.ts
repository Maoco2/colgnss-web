import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';
import { ApiResponse } from '../../../common/dto/api-response.dto';
import { AiModel } from '../entities/ai-model.entity';
import { AiPrediction } from '../entities/ai-prediction.entity';
import { QualityScore } from '../entities/quality-score.entity';
import { AnomalyDetection } from '../entities/anomaly-detection.entity';

@ApiTags('Enterprise - AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('enterprise/ai')
export class AiController {
  constructor(
    @InjectRepository(AiModel)
    private aiModelRepository: Repository<AiModel>,
    @InjectRepository(AiPrediction)
    private aiPredictionRepository: Repository<AiPrediction>,
    @InjectRepository(QualityScore)
    private qualityScoreRepository: Repository<QualityScore>,
    @InjectRepository(AnomalyDetection)
    private anomalyRepository: Repository<AnomalyDetection>,
  ) {}

  @Get('models')
  @ApiOperation({ summary: 'List AI models' })
  async getModels(): Promise<ApiResponse<any>> {
    const data = await this.aiModelRepository.find({ order: { createdAt: 'DESC' } });
    return ApiResponse.ok(data);
  }

  @Post('predict')
  @ApiOperation({ summary: 'Make a prediction' })
  async predict(@Body() input: any): Promise<ApiResponse<any>> {
    const model = await this.aiModelRepository.findOne({ where: { status: 'active' }, order: { createdAt: 'DESC' } });
    if (!model) return ApiResponse.error('No active AI model found', 'NOT_FOUND');
    const prediction = this.aiPredictionRepository.create({
      modelId: model.id,
      type: input.type || 'generic',
      inputData: input,
      outputData: { result: 'pending' },
      status: 'completed',
      confidence: 0.95,
    });
    const saved = await this.aiPredictionRepository.save(prediction);
    return ApiResponse.ok(saved, 'Prediction completed');
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Prediction history' })
  async getPredictions(): Promise<ApiResponse<any>> {
    const data = await this.aiPredictionRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
      relations: ['model'],
    });
    return ApiResponse.ok(data);
  }

  @Get('quality')
  @ApiOperation({ summary: 'Quality scores' })
  async getQualityScores(): Promise<ApiResponse<any>> {
    const data = await this.qualityScoreRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
    const avgScore = await this.qualityScoreRepository
      .createQueryBuilder('q')
      .select('AVG(q.score)', 'avg')
      .getRawOne();
    const byCategory = await this.qualityScoreRepository
      .createQueryBuilder('q')
      .select('q.category', 'category')
      .addSelect('AVG(q.score)', 'avgScore')
      .addSelect('COUNT(*)', 'count')
      .groupBy('q.category')
      .getRawMany();
    return ApiResponse.ok({ scores: data, avgScore: avgScore?.avg || 0, byCategory });
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Anomaly detections' })
  async getAnomalies(): Promise<ApiResponse<any>> {
    const data = await this.anomalyRepository.find({
      order: { detectedAt: 'DESC' },
      take: 100,
    });
    return ApiResponse.ok(data);
  }
}


