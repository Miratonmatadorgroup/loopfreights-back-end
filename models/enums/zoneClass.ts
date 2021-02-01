
export enum ZoneClass {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E'
}

export const getZoneClasses = (): ZoneClass[] => {
    return Object.values(ZoneClass);
};
