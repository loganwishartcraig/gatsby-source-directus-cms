import Colors from 'colors'; // eslint-disable-line

Colors.black;

export const log = {
    info: (msg: string, ...args: any[]) => console.log('GSD_CMS'.blue, 'info'.cyan, msg, ...args),
    warn: (msg: string, ...args: any[]) => console.log('GSD_CMS'.blue, 'warning'.yellow, msg, ...args),
    error: (msg: string, ...args: any[]) => console.error('GSD_CMS'.blue, 'error'.red, msg, ...args),
    success: (msg: string, ...args: any[]) => console.log('GSD_CMS'.blue, 'success'.green, msg, ...args),
};
