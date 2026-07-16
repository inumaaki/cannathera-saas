"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_HOME = exports.ROLES = void 0;
// Role constants shared between web and api. Mirror of Prisma `Role` enum.
exports.ROLES = ["PATIENT", "DOCTOR", "PHARMACY", "ENTERPRISE", "ADMIN"];
// Landing route per role after login (dashboard shells filled in later modules).
exports.ROLE_HOME = {
    PATIENT: "/patient",
    DOCTOR: "/doctor",
    PHARMACY: "/pharmacy",
    ENTERPRISE: "/enterprise",
    ADMIN: "/admin",
};
