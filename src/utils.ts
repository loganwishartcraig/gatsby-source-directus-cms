import Colors from 'colors'; // eslint-disable-line

Colors.black;

export const log = {
    info: (msg: string, ...args: any[]) => console.log('GSD7_alpha:'.blue, 'info'.cyan, msg, ...args),
    warn: (msg: string, ...args: any[]) => console.log('GSD7_alpha:'.blue, 'warning'.yellow, msg, ...args),
    error: (msg: string, ...args: any[]) => console.error('GSD7_alpha:'.blue, 'error'.red, msg, ...args),
    success: (msg: string, ...args: any[]) => console.log('GSD7_alpha:'.blue, 'success'.green, msg, ...args),
};
