import xlsx from "xlsx";
import { parse } from "csv-parse";

export interface ImportFileUseCasePort {
    execute(file: Express.Multer.File): Promise<ImportFileUseCaseResponse>;
}

export interface ImportFileUseCaseResponse {
    success: boolean;
    message?: string;
    data?: any;
}

interface Subscription {
    quantidade: number;
    cobradaACadaXDias: number;
    dataInicio: string;
    status: string;
    dataStatus: string;
    dataCancelamento: string | null;
    valor: number;
    proximoCiclo: string | null;
    idAssinante: string;
}

export default class ImportFileUseCase implements ImportFileUseCasePort {
    // constructor() {}

    private subscriptions = [];

    async execute(file: Express.Multer.File): Promise<ImportFileUseCaseResponse> {
        this.subscriptions = [];

        try {
            if (file.originalname.endsWith(".csv") && file.mimetype === "text/csv") {
                await this.processCSV(file, this.subscriptions);
            } else if (
                file.originalname.endsWith(".xlsx") &&
                file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ) {
                await this.processExcel(file, this.subscriptions);
            } else {
                throw new Error("Unsupported file format. File must be .csv or .xlsx format");
            }

            return { success: true, data: this.calculateMetrics(this.subscriptions) };
        } catch (error) {
            throw new Error(error);
        }
    }

    private async processCSV(file: any, subscriptions: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const csvString = file.buffer.toString();

            parse(csvString, {
                columns: true,
                trim: true,
            })
                .on("data", (row) => {
                    try {
                        subscriptions.push({
                            quantidade: parseInt(row["quantidade cobranças"]),
                            cobradaACadaXDias: parseInt(row["cobrada a cada X dias"]),
                            dataInicio: this.parseCSVDate(row["data início"]),
                            status: row["status"],
                            dataStatus: new Date(row["data status"]),
                            dataCancelamento: new Date(row["data cancelamento"]),
                            valor: parseFloat(row["valor"].replace(",", ".")),
                            proximoCiclo: new Date(this.parseCSVDate(row["próximo ciclo"])),
                            idAssinante: row["ID assinante"],
                        });
                    } catch (error) {
                        reject(new Error(error));
                    }
                })
                .on("end", () => {
                    this.sortSubscriptionsByDataInicio();

                    resolve();
                })
                .on("error", (error) => {
                    reject(error);
                });
        });
    }

    private async processExcel(file: any, subscriptions: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const data = new Uint8Array(file.buffer);
            const workbook = xlsx.read(data, { type: "array" });
            const sheet_name_list = workbook.SheetNames;
            const dados = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

            for (const row of dados) {
                try {
                    subscriptions.push({
                        quantidade: parseInt(row["quantidade cobranças"]),
                        cobradaACadaXDias: parseInt(row["cobrada a cada X dias"]),
                        dataInicio:
                            typeof row["data início"] === "string"
                                ? this.transformToDateISOString(row["data início"])
                                : this.parseExcelDate(row["data início"]),
                        status: row["status"],
                        dataStatus: this.parseExcelDate(row["data status"]),
                        dataCancelamento: this.parseExcelDate(row["data cancelamento"]),
                        valor: parseFloat(row["valor"]),
                        proximoCiclo:
                            typeof row["próximo ciclo"] === "string"
                                ? this.transformToDateISOString(row["próximo ciclo"])
                                : this.parseExcelDate(row["próximo ciclo"]),
                        idAssinante: row["ID assinante"],
                    });
                } catch (error) {
                    reject(new Error("Invalid date format"));
                }
            }

            this.sortSubscriptionsByDataInicio();

            resolve();
        });
    }

    private transformToDateISOString(dateString: string): string {
        if (!dateString) return null;

        const [month, day, year] = dateString.split("/");

        if (parseInt(month) > 12) return new Date(`${day}/${month}/${year}`).toISOString();

        return new Date(`${month}/${day}/${year}`).toISOString();
    }

    private sortSubscriptionsByDataInicio() {
        return this.subscriptions.sort((a, b) => {
            const dateA = new Date(a.dataInicio).getTime();
            const dateB = new Date(b.dataInicio).getTime();
            return dateA - dateB;
        });
    }

    private parseExcelDate(excelDate: number): Date | null {
        const date = xlsx.SSF.parse_date_code(excelDate);
        return date ? new Date(Date.UTC(date.y, date.m - 1, date.d, date.H, date.M, date.S, 0)) : null;
    }

    private parseCSVDate(dateString: string): Date {
        if (!dateString) return null;
        const [month, day, year] = dateString.split("/");
        if (parseInt(month) > 12) return new Date(`${day}/${month}/${year}`);
        return new Date(`${month}/${day}/${year}`);
    }

    private calculateMetrics(subscriptions: Subscription[]) {
        const result = { mrr: {}, churnRate: {}, subscriptions };

        const subscriptionsByMonth = this.groupSubscriptionsByMonth(subscriptions);

        Object.keys(subscriptionsByMonth).forEach((month) => {
            result.mrr[month] = this.calculateMonthlyMRR(subscriptionsByMonth[month]);
            result.churnRate[month] = this.calculateMonthlyChurnRate(subscriptionsByMonth[month]);
        });

        result.mrr = this.orderByAscendingDate(result.mrr);
        result.churnRate = this.orderByAscendingDate(result.churnRate);

        return result;
    }

    private orderByAscendingDate(object: { [key: string]: number }) {
        const sortedEntries = Object.entries(object).sort(([dateA], [dateB]) => {
            const [monthA, yearA] = dateA.split("/");
            const [monthB, yearB] = dateB.split("/");

            const dateAFormatted = `${yearA}${monthA.padStart(2, "0")}`;
            const dateBFormatted = `${yearB}${monthB.padStart(2, "0")}`;

            return dateAFormatted.localeCompare(dateBFormatted);
        });

        return Object.fromEntries(sortedEntries);
    }

    private groupSubscriptionsByMonth(subscriptions: Subscription[]) {
        const result = {};

        subscriptions.forEach((subscription: any) => {
            const date = new Date(subscription.proximoCiclo);
            const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
            const year = date.getUTCFullYear();
            const monthYear = `${month}/${year}`;

            if (!result[monthYear]) result[monthYear] = [];

            result[monthYear].push(subscription);
        });

        return result;
    }

    private calculateMonthlyMRR(subscriptions: Subscription[]): number {
        return Number(subscriptions.reduce((acc: number, subscription: any) => acc + subscription.valor, 0).toFixed(2));
    }

    private calculateMonthlyChurnRate(subscriptions: Subscription[]): number {
        const canceledSubscriptions = subscriptions.filter((subscription) => subscription.status === "Cancelada");
        return Number(((canceledSubscriptions.length / subscriptions.length) * 100 || 0).toFixed(2));
    }
}
