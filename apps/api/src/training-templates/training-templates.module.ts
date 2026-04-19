import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TrainingTemplatesController } from './training-templates.controller';
import { TrainingTemplatesService } from './training-templates.service';

@Module({
  imports: [AuthModule],
  controllers: [TrainingTemplatesController],
  providers: [TrainingTemplatesService],
  exports: [TrainingTemplatesService],
})
export class TrainingTemplatesModule {}
