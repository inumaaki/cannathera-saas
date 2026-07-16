import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';
import { IntegrationsService } from './integrations.service';
import { SettingsService } from './settings.service';

@Module({
  controllers: [EnterpriseController],
  providers: [
    EnterpriseService,
    IntegrationsService,
    BillingService,
    SettingsService,
  ],
  // Clinical modules dispatch domain events through this.
  exports: [IntegrationsService],
})
export class EnterpriseModule {}
