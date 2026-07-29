import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AiService } from './ai.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, AiService],
  exports: [ReportsService],
})
export class ReportsModule {}
