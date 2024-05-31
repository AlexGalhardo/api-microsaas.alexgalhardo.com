import { Controller, Post, Res, Inject, HttpStatus, UseInterceptors, UploadedFile } from "@nestjs/common";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { ImportFileUseCasePort } from "src/UseCases/ImportFile.useCase";

interface ImportDataControllerPort {
    importFile(file: Express.Multer.File, response: Response): Promise<Response<ImportFileResponse>>;
}

interface ImportFileResponse {
    success: boolean;
    data?: any;
    message?: string;
}

@Controller()
export class ImportDataController implements ImportDataControllerPort {
    constructor(@Inject("ImportFileUseCasePort") private readonly importFileUseCase: ImportFileUseCasePort) {}

    @Post("/file")
    @UseInterceptors(FileInterceptor("file"))
    async importFile(
        @UploadedFile() file: Express.Multer.File,
        @Res() response: Response,
    ): Promise<Response<ImportFileResponse>> {
        try {
            if (!file)
                return response.status(HttpStatus.BAD_REQUEST).json({ success: false, message: "No file uploaded" });

            const { success, data, message } = await this.importFileUseCase.execute(file);

            if (success) return response.status(HttpStatus.OK).json({ success: true, data });

            return response.status(HttpStatus.BAD_REQUEST).json({ success: false, message });
        } catch (error) {
            return response.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.message });
        }
    }
}
