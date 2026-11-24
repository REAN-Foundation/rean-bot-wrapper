import * as path from 'path';

export class Helper {

    public static rootDir = (): string => {
        return path.resolve(__dirname, '..', '..');
    };

}
