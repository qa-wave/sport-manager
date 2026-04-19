import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { TrainingTemplatesModule } from '../training-templates/training-templates.module';

@Module({
  imports: [AuthModule, forwardRef(() => TrainingTemplatesModule)],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
