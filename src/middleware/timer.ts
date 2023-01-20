import express from "express";

export class Timer {

    private _app: express.Application = null;

    constructor(app: express.Application) {
        this._app = app;
    }

    getDurationInMilliseconds = (start) => {
        const nanosecond = 1e9;
        const milliToNanoSecond = 1e6;
        const diff = process.hrtime(start);
    
        return (diff[0] * nanosecond + diff[1]) / milliToNanoSecond;
    }

    timingRequestAndResponseCycle = () => {
        this._app.use((req,res,next) => {
            console.log(`${req.method} ${req.originalUrl} [STARTED]`);
            const start = process.hrtime();
        
            res.on('finish', () => {
                const durationInMilliseconds = this.getDurationInMilliseconds(start);
                console.log(`${req.method} ${req.originalUrl} [FINISHED] ${durationInMilliseconds.toLocaleString()} ms`);
            });
        
            res.on('close', () => {
                const durationInMilliseconds = this.getDurationInMilliseconds(start);
                console.log(`${req.method} ${req.originalUrl} [CLOSED] ${durationInMilliseconds.toLocaleString()} ms`);
            });
        
            next();
        });
    }
}