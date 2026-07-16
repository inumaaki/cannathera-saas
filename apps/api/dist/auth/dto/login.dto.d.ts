export declare class LoginDto {
    email: string;
    password: string;
    remember?: boolean;
}
export declare class VerifyDto {
    code: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ChangePasswordDto {
    password: string;
}
export declare class ResetPasswordDto {
    token: string;
    password: string;
}
