
export enum ZoneClass {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'E',
    F = 'F'
}

export const getZoneClasses = (): ZoneClass[] => {
    return Object.values(ZoneClass);
};
