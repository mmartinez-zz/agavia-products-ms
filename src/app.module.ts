import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { ObservabilityModule } from '@mmartinez-zz/agavia-observability';

@Module({
  imports: [
    ObservabilityModule.forRoot({
      serviceName: 'agavia-products-ms',
      enableGlobalInterceptor: true,
      skipRoutes: ['/health'],
    }),
    ProductsModule,
  ],
})
export class AppModule {}
