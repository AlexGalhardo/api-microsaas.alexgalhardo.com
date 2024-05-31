import { Module, NestModule } from "@nestjs/common";
import { ImportDataModule } from "./Modules/ImportData.module";
import { HealthCheckModule } from "./Modules/HealthCheck.module";
import { ConfigModule } from "@nestjs/config";

@Module({
	imports: [HealthCheckModule, ImportDataModule, ConfigModule.forRoot({ isGlobal: true })],
	controllers: [],
	providers: [],
})
export class AppModule implements NestModule {
	configure() {}
}
