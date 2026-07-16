"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CAN = exports.ORG_ROLES = void 0;
exports.membershipOf = membershipOf;
exports.normalizeRole = normalizeRole;
exports.requirePermission = requirePermission;
const common_1 = require("@nestjs/common");
exports.ORG_ROLES = ['SUPER_ADMIN', 'SUPPORT', 'BILLING', 'VIEWER'];
exports.CAN = {
    SUPER_ADMIN: [
        'team:manage',
        'settings:manage',
        'keys:manage',
        'webhooks:manage',
        'partners:manage',
        'branding:manage',
        'billing:manage',
        'billing:view',
        'network:view',
    ],
    SUPPORT: ['partners:manage', 'network:view'],
    BILLING: ['billing:view', 'network:view'],
    VIEWER: ['network:view'],
};
async function membershipOf(prisma, userId) {
    const membership = await prisma.membership.findFirst({
        where: { userId },
        include: { org: true },
    });
    if (!membership)
        throw new common_1.NotFoundException('NO_ORGANIZATION');
    return membership;
}
function normalizeRole(orgRole) {
    if (orgRole === 'ADMIN')
        return 'SUPER_ADMIN';
    return exports.ORG_ROLES.includes(orgRole) ? orgRole : 'VIEWER';
}
async function requirePermission(prisma, userId, permission) {
    const membership = await membershipOf(prisma, userId);
    const allowed = exports.CAN[normalizeRole(membership.orgRole)];
    if (!allowed.includes(permission)) {
        throw new common_1.ForbiddenException('MISSING_PERMISSION');
    }
    return membership;
}
//# sourceMappingURL=access.js.map