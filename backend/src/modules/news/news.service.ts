import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './news.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
  ) {}

  async create(data: Partial<News>): Promise<News> {
    const news = this.newsRepository.create(data);
    return this.newsRepository.save(news);
  }

  async findAll(page = 1, limit = 20, publishedOnly = true) {
    const where: any = publishedOnly ? { isPublished: true } : {};
    const [data, total] = await this.newsRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<News> {
    const news = await this.newsRepository.findOne({ where: { id } });
    if (!news) throw new NotFoundException('News not found');
    return news;
  }

  async update(id: string, data: Partial<News>): Promise<News> {
    await this.newsRepository.update(id, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.newsRepository.delete(id);
  }
}
