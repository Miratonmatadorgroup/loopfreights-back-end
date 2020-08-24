
export const reqAsAny = (req: any): any => {
    return req;
};

export const normalizePhone = (phone: string, userId?: string): string => {
    if (!phone || phone.startsWith('+')) return phone;
    phone = phone.startsWith('0') ? phone.substr(1) : phone;
    phone = '+234' + phone.trim().replace(/\s/g, '');
    return phone;
};

export const getNextPageKey = (items: Array<{_id: string}>): string => {
    return items.length === 0 ? null : items[items.length - 1]._id;
};

export const stringToBoolean = (value: any): boolean => {
    if (!value) return false;
    value = value.toLowerCase();
    return value === 'true';
};

export const stripUpdateFields = <T> (model): T => {
    if (!model) return model;
    delete model._id;
    delete model.createdAt;
    delete model.updatedAt;
    return model;
};

export const getUpdateOptions = (): {runValidators: boolean, setDefaultsOnInsert: boolean, upsert: boolean, new: boolean} => {
    return {runValidators: true, setDefaultsOnInsert: true, upsert: true, new: true};
};
