export declare class RescheduleDto {
    scheduledAt: string;
}
export declare class CreateLogDto {
    dosageG: number;
    strain?: string;
    pain?: number;
    sleep?: number;
    activity?: number;
    qol?: number;
    note?: string;
}
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    pharmacyOrgId?: string | null;
}
