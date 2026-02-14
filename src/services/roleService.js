import firestoreService from './firestoreService';

const roleService = {
  collection: firestoreService.collections.roles,

  async getRolePermissions(roleId) {
    return firestoreService.getById(this.collection, roleId);
  },

  async saveRolePermissions(roleId, permissions) {
    return firestoreService.set(this.collection, roleId, { permissions });
  },

  async getAllRolePermissions() {
    const roles = await firestoreService.getAll(this.collection);
    return roles.reduce((acc, curr) => {
      acc[curr.id] = curr.permissions;
      return acc;
    }, {});
  }
};

export default roleService;
