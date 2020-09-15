
export enum DriverType {
    EXTERNAL = 'external',
    INTERNAL = 'internal'
}

export const getSupportedDriverTypes = (): DriverType[] => {
    return Object.values(DriverType);
}
