import { Module } from "@nestjs/common";
import { ImportDataController } from "src/Controllers/ImportData.controller";
import ImportFileUseCase from "src/UseCases/ImportFile.useCase";

@Module({
    controllers: [ImportDataController],
    providers: [
        {
            provide: "ImportFileUseCasePort",
            inject: [],
            useFactory: () => {
                return new ImportFileUseCase();
            },
        },
    ],
})
export class ImportDataModule {}
